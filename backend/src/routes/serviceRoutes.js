const express = require('express');
const router = express.Router();
const { getActiveServices } = require('../controllers/serviceCounterController');

// GET /api/services (Public endpoint for customers to browse active service categories)
router.get('/', getActiveServices);

module.exports = router;
