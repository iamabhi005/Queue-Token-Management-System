const express = require('express');
const router = express.Router();
const { getDatasetsOverview } = require('../controllers/databaseController');

// Public endpoint to inspect database dataset architecture and statistics
router.get('/datasets', getDatasetsOverview);

module.exports = router;
