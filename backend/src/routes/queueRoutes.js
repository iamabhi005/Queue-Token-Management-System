const express = require('express');
const router = express.Router();
const Token = require('../models/Token');
const Counter = require('../models/Counter');

/**
 * GET /api/queue/today
 * Public endpoint — returns today's tokens for display boards & customer pages
 */
router.get('/today', async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tokens = await Token.find({ createdAt: { $gte: todayStart } })
      .populate('serviceId', 'name averageServiceTime')
      .populate('counterId', 'name')
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/queue/counters
 * Public endpoint — returns all active counters for display boards
 */
router.get('/counters', async (req, res, next) => {
  try {
    const counters = await Counter.find({ isActive: true })
      .populate('serviceId', 'name averageServiceTime isActive')
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: counters.length,
      data: counters
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
