const express = require('express');
const router = express.Router();
const { verifyToken, requireRole } = require('../middlewares/auth');
const {
  validateObjectId,
  validateCreateService,
  validateCreateCounter
} = require('../middlewares/validate');

const {
  getTokens,
  getStats,
  callNextToken,
  completeToken,
  skipToken
} = require('../controllers/adminController');

const {
  createService,
  getCounters,
  createCounter
} = require('../controllers/serviceCounterController');

// All admin routes require valid JWT authentication and administrative/staff role
router.use(verifyToken);
router.use(requireRole('ADMIN', 'STAFF'));

// Queue Monitoring & Management Endpoints
router.get('/tokens', getTokens);
router.get('/stats', getStats);
router.post('/tokens/next', callNextToken);
router.patch('/tokens/:id/complete', validateObjectId('id'), completeToken);
router.patch('/tokens/:id/skip', validateObjectId('id'), skipToken);

// Service & Counter Management
router.get('/counters', getCounters);

// Admin-only endpoints for configuration
router.post('/services', requireRole('ADMIN'), validateCreateService, createService);
router.post('/counters', requireRole('ADMIN'), validateCreateCounter, createCounter);

module.exports = router;
