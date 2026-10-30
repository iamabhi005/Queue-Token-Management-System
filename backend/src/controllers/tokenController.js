const Token = require('../models/Token');
const Service = require('../models/Service');
const Counter = require('../models/Counter');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');
const { generateNextTokenNumber } = require('../utils/tokenGenerator');
const { emitQueueUpdate } = require('../config/socket');
const { recordTokenInCsv, recordActivityLogInCsv, syncTokensCsv, syncSequencesCsv, syncActivityLogsCsv } = require('../utils/csvSync');

/**
 * POST /api/tokens
 * Customer issues a new token with safe concurrency-safe sequence generation
 */
const createToken = async (req, res, next) => {
  try {
    const { customerName, serviceId } = req.body;

    // Verify service exists and is active
    const service = await Service.findById(serviceId);
    if (!service) {
      return next(new AppError('The requested service does not exist.', 404));
    }
    if (!service.isActive) {
      return next(new AppError(`The service "${service.name}" is currently inactive.`, 400));
    }

    // Generate collision-free sequential token number atomically
    const { tokenNumber, dateCode } = await generateNextTokenNumber(service);

    // Create the token in database
    const token = await Token.create({
      tokenNumber,
      customerName: customerName.trim(),
      serviceId: service._id,
      dateCode,
      status: 'WAITING',
      createdAt: new Date()
    });

    // Find designated active counter(s) for this service
    const assignedCounters = await Counter.find({
      serviceId: service._id,
      isActive: true
    }).select('name');
    const designatedCounterName = assignedCounters.length > 0
      ? assignedCounters.map(c => c.name).join(', ')
      : 'Counter Station';

    // Record in activity logs dataset
    const tokenLog = {
      action: 'TOKEN_CREATED',
      dataset: 'tokens',
      details: { tokenId: token._id, tokenNumber: token.tokenNumber, customerName: token.customerName, service: service.name, counter: designatedCounterName },
      performedBy: customerName.trim(),
      createdAt: new Date()
    };
    await ActivityLog.create(tokenLog).catch(err => console.warn('[ActivityLog] Could not log token creation:', err.message));

    // Automatically store in CSV database files with designated counter
    recordTokenInCsv(token, service.name, designatedCounterName);
    recordActivityLogInCsv(tokenLog);
    syncTokensCsv();
    syncSequencesCsv();
    syncActivityLogsCsv();

    // Calculate queue backlog ahead of this customer
    const waitingAhead = await Token.countDocuments({
      serviceId: service._id,
      status: 'WAITING',
      createdAt: { $lt: token.createdAt }
    });

    const estimatedWaitMinutes = Math.max(
      service.averageServiceTime,
      (waitingAhead + 1) * service.averageServiceTime
    );

    // Find if a token is currently being served for this service
    const currentServing = await Token.findOne({
      serviceId: service._id,
      status: 'SERVING'
    }).populate('counterId', 'name');

    // Broadcast live event to all connected clients & public display screens
    emitQueueUpdate('TOKEN_ISSUED', {
      token: {
        ...token.toObject(),
        counterNumber: designatedCounterName,
        designatedCounter: designatedCounterName
      },
      service: { id: service._id, name: service.name },
      designatedCounter: designatedCounterName,
      waitingAhead,
      estimatedWaitMinutes
    });

    res.status(201).json({
      success: true,
      message: 'Token issued successfully.',
      data: {
        token,
        service: {
          id: service._id,
          name: service.name,
          averageServiceTime: service.averageServiceTime
        },
        designatedCounter: designatedCounterName,
        counterNumber: designatedCounterName,
        waitingAhead,
        estimatedWaitMinutes,
        currentServingToken: currentServing ? currentServing.tokenNumber : null,
        currentServingCounter: currentServing?.counterId ? currentServing.counterId.name : null
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tokens/:id
 * Retrieve specific token details
 */
const getTokenById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const token = await Token.findById(id)
      .populate('serviceId', 'name description averageServiceTime isActive')
      .populate('counterId', 'name isActive');

    if (!token) {
      return next(new AppError(`Token with ID "${id}" was not found.`, 404));
    }

    res.status(200).json({
      success: true,
      data: token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/tokens/status/:id
 * Real-time queue tracker for a token
 */
const getTokenStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const token = await Token.findById(id)
      .populate('serviceId', 'name averageServiceTime')
      .populate('counterId', 'name');

    if (!token) {
      return next(new AppError(`Token with ID "${id}" was not found.`, 404));
    }

    let waitingAhead = 0;
    let estimatedWaitMinutes = 0;

    if (token.status === 'WAITING') {
      waitingAhead = await Token.countDocuments({
        serviceId: token.serviceId._id,
        status: 'WAITING',
        createdAt: { $lt: token.createdAt }
      });

      const avgTime = token.serviceId?.averageServiceTime || 10;
      estimatedWaitMinutes = Math.max(avgTime, (waitingAhead + 1) * avgTime);
    }

    // Active serving token in the same service category
    const activeServing = await Token.findOne({
      serviceId: token.serviceId._id,
      status: 'SERVING'
    }).populate('counterId', 'name');

    // Designated counter for this service
    const assignedCounters = await Counter.find({
      serviceId: token.serviceId._id,
      isActive: true
    }).select('name');
    const designatedCounter = assignedCounters.length > 0 ? assignedCounters.map(c => c.name).join(', ') : 'Counter Station';

    res.status(200).json({
      success: true,
      data: {
        token,
        status: token.status,
        designatedCounter: token.counterId?.name || designatedCounter,
        counterNumber: token.counterId?.name || designatedCounter,
        waitingAhead,
        estimatedWaitMinutes: token.status === 'WAITING' ? estimatedWaitMinutes : 0,
        currentServing: activeServing ? {
          tokenNumber: activeServing.tokenNumber,
          counterName: activeServing.counterId ? activeServing.counterId.name : null
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createToken,
  getTokenById,
  getTokenStatus
};
