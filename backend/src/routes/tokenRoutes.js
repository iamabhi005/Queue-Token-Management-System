const express = require('express');
const router = express.Router();
const {
  createToken,
  getTokenById,
  getTokenStatus
} = require('../controllers/tokenController');
const {
  validateCreateToken,
  validateObjectId
} = require('../middlewares/validate');

// Public Customer Queue Endpoints
router.post('/', validateCreateToken, createToken);
router.get('/:id', validateObjectId('id'), getTokenById);
router.get('/status/:id', validateObjectId('id'), getTokenStatus);

module.exports = router;
