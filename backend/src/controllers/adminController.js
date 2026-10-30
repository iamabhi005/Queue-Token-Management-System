const Token = require('../models/Token');
const Counter = require('../models/Counter');
const Service = require('../models/Service');
const AppError = require('../utils/AppError');
const { emitQueueUpdate } = require('../config/socket');
const { recordTokenInCsv, syncTokensCsv } = require('../utils/csvSync');

/**
 * GET /api/admin/tokens
 * Query all tokens with filtering by status, serviceId, counterId, date, and pagination
 */
const getTokens = async (req, res, next) => {
  try {
    const { status, serviceId, counterId, date, search, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status && ['WAITING', 'SERVING', 'COMPLETED', 'SKIPPED'].includes(status.toUpperCase())) {
      query.status = status.toUpperCase();
    }
    if (serviceId) {
      query.serviceId = serviceId;
    }
    if (counterId) {
      query.counterId = counterId;
    }
    if (date) {
      const parsedDate = new Date(date);
      if (!isNaN(parsedDate.getTime())) {
        const startOfDay = new Date(parsedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(parsedDate);
        endOfDay.setHours(23, 59, 59, 999);
        query.createdAt = { $gte: startOfDay, $lte: endOfDay };
      }
    }
    if (search && typeof search === 'string') {
      const sanitizedSearch = search.trim().slice(0, 50).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { tokenNumber: { $regex: sanitizedSearch, $options: 'i' } },
        { customerName: { $regex: sanitizedSearch, $options: 'i' } }
      ];
    }

    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (safePage - 1) * safeLimit;
    const total = await Token.countDocuments(query);

    const tokens = await Token.find(query)
      .populate('serviceId', 'name averageServiceTime')
      .populate('counterId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit);

    res.status(200).json({
      success: true,
      total,
      page: safePage,
      totalPages: Math.ceil(total / safeLimit) || 1,
      limit: safeLimit,
      data: tokens
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/stats
 * Real-time operational queue statistics
 */
const getStats = async (req, res, next) => {
  try {
    // Current operating day boundary (00:00:00 to 23:59:59)
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } };

    const totalToday = await Token.countDocuments(todayFilter);
    const waitingCount = await Token.countDocuments({ ...todayFilter, status: 'WAITING' });
    const servingCount = await Token.countDocuments({ ...todayFilter, status: 'SERVING' });
    const completedCount = await Token.countDocuments({ ...todayFilter, status: 'COMPLETED' });
    const skippedCount = await Token.countDocuments({ ...todayFilter, status: 'SKIPPED' });

    // Calculate Average Wait Time (createdAt -> calledAt) in minutes
    const servedTokens = await Token.find({
      ...todayFilter,
      calledAt: { $ne: null }
    }).select('createdAt calledAt');

    let totalWaitMs = 0;
    servedTokens.forEach(t => {
      totalWaitMs += new Date(t.calledAt).getTime() - new Date(t.createdAt).getTime();
    });
    const avgWaitMinutes = servedTokens.length > 0
      ? Math.round((totalWaitMs / servedTokens.length) / 60000)
      : 0;

    // Calculate Average Handling Time (calledAt -> completedAt) in minutes
    const completedTokens = await Token.find({
      ...todayFilter,
      calledAt: { $ne: null },
      completedAt: { $ne: null }
    }).select('calledAt completedAt');

    let totalServiceMs = 0;
    completedTokens.forEach(t => {
      totalServiceMs += new Date(t.completedAt).getTime() - new Date(t.calledAt).getTime();
    });
    const avgServiceMinutes = completedTokens.length > 0
      ? Math.round((totalServiceMs / completedTokens.length) / 60000)
      : 0;

    res.status(200).json({
      success: true,
      data: {
        totalToday,
        waitingCount,
        servingCount,
        completedCount,
        skippedCount,
        averageWaitMinutes: avgWaitMinutes,
        averageServiceMinutes: avgServiceMinutes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/tokens/next
 * Counter staff calls the next waiting customer for their station
 */
const callNextToken = async (req, res, next) => {
  try {
    const { counterId, serviceId } = req.body;

    let targetServiceId = serviceId;
    let counterDoc = null;

    if (counterId) {
      counterDoc = await Counter.findById(counterId).catch(() => null);
      if (counterDoc) {
        targetServiceId = targetServiceId || counterDoc.serviceId;
      }
    }

    // If no counter found by ID, fallback to the first active station
    if (!counterDoc) {
      counterDoc = await Counter.findOne({ isActive: true });
      if (counterDoc) {
        targetServiceId = targetServiceId || counterDoc.serviceId;
      }
    }

    // Automatically complete any prior token being served at this counter so counter never gets stuck
    if (counterDoc) {
      await Token.updateMany(
        { counterId: counterDoc._id, status: 'SERVING' },
        { status: 'COMPLETED', completedAt: new Date() }
      );
    }

    // 1. Try to find the next WAITING token for this counter's assigned service (FIFO order)
    let nextToken = null;
    if (targetServiceId) {
      nextToken = await Token.findOneAndUpdate(
        { serviceId: targetServiceId, status: 'WAITING' },
        {
          status: 'SERVING',
          counterId: counterDoc ? counterDoc._id : null,
          calledAt: new Date()
        },
        {
          sort: { createdAt: 1 },
          new: true
        }
      ).populate('serviceId', 'name averageServiceTime')
       .populate('counterId', 'name');
    }

    // 2. Fallback: If no waiting customer for this specific service, call next waiting from ANY service!
    if (!nextToken) {
      nextToken = await Token.findOneAndUpdate(
        { status: 'WAITING' },
        {
          status: 'SERVING',
          counterId: counterDoc ? counterDoc._id : null,
          calledAt: new Date()
        },
        {
          sort: { createdAt: 1 },
          new: true
        }
      ).populate('serviceId', 'name averageServiceTime')
       .populate('counterId', 'name');
    }

    if (!nextToken) {
      return res.status(200).json({
        success: false,
        message: 'No waiting tokens in the queue. All customers have been served!',
        data: null
      });
    }

    // Broadcast live calling event across public display and admin monitors
    emitQueueUpdate('TOKEN_CALLED', {
      token: nextToken,
      counter: counterDoc,
      timestamp: new Date()
    });

    // Synchronize CSV dataset immediately
    recordTokenInCsv(nextToken, nextToken.serviceId?.name, counterDoc?.name);
    syncTokensCsv();

    res.status(200).json({
      success: true,
      message: `Token ${nextToken.tokenNumber} called to ${counterDoc ? counterDoc.name : 'counter'}.`,
      data: nextToken
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/tokens/:id/complete
 * Marks an in-progress token as completed
 */
const completeToken = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Atomically transition from SERVING or WAITING to COMPLETED
    const token = await Token.findOneAndUpdate(
      { _id: id, status: { $in: ['SERVING', 'WAITING'] } },
      { 
        status: 'COMPLETED', 
        completedAt: new Date()
      },
      { new: true }
    )
      .populate('serviceId', 'name')
      .populate('counterId', 'name');

    if (!token) {
      const existing = await Token.findById(id).catch(() => null);
      if (!existing) {
        return next(new AppError(`Token with ID "${id}" was not found.`, 404));
      }
      if (existing.status === 'COMPLETED') {
        return next(new AppError('Token is already marked as completed.', 400));
      }
      return next(new AppError(`Cannot complete token in "${existing.status}" status.`, 400));
    }

    // Ensure calledAt is recorded if completed directly
    if (!token.calledAt) {
      token.calledAt = token.createdAt || new Date();
      await token.save().catch(() => {});
    }

    // If this token had a counter, ensure no lingering SERVING tokens remain on this counter
    if (token.counterId) {
      const cId = token.counterId._id || token.counterId;
      await Token.updateMany(
        { counterId: cId, status: 'SERVING', _id: { $ne: token._id } },
        { status: 'COMPLETED', completedAt: new Date() }
      );
    }

    // Broadcast completion to update waiting queue statistics
    emitQueueUpdate('TOKEN_COMPLETED', {
      token,
      timestamp: new Date()
    });

    // Synchronize CSV dataset immediately
    recordTokenInCsv(token, token.serviceId?.name, token.counterId?.name);
    syncTokensCsv();

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} marked as completed.`,
      data: token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/admin/tokens/:id/skip
 * Marks a token as skipped (customer no-show)
 */
const skipToken = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Atomically transition from WAITING or SERVING to SKIPPED
    const token = await Token.findOneAndUpdate(
      { _id: id, status: { $in: ['WAITING', 'SERVING'] } },
      { status: 'SKIPPED', completedAt: new Date() },
      { new: true }
    )
      .populate('serviceId', 'name')
      .populate('counterId', 'name');

    if (!token) {
      const existing = await Token.findById(id).catch(() => null);
      if (!existing) {
        return next(new AppError(`Token with ID "${id}" was not found.`, 404));
      }
      if (existing.status === 'SKIPPED') {
        return next(new AppError('Token is already marked as skipped.', 400));
      }
      return next(new AppError(`Cannot skip token in "${existing.status}" status.`, 400));
    }

    // Broadcast skip event to refresh display screen
    emitQueueUpdate('TOKEN_SKIPPED', {
      token,
      timestamp: new Date()
    });

    // Synchronize CSV dataset immediately
    recordTokenInCsv(token, token.serviceId?.name, token.counterId?.name);
    syncTokensCsv();

    res.status(200).json({
      success: true,
      message: `Token ${token.tokenNumber} marked as skipped.`,
      data: token
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTokens,
  getStats,
  callNextToken,
  completeToken,
  skipToken
};
