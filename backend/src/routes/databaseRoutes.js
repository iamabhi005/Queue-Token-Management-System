const express = require('express');
const router = express.Router();
const { getDatasetsOverview, downloadDatasetCsv } = require('../controllers/databaseController');

// Public endpoint to inspect database dataset architecture and statistics
router.get('/datasets', getDatasetsOverview);

// Direct download of any dataset in CSV format (e.g. /export/tokens/csv, /export/users/csv)
router.get('/export/:dataset/csv', downloadDatasetCsv);

module.exports = router;
