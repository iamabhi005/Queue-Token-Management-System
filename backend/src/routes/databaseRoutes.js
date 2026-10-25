const express = require('express');
const router = express.Router();
const { getDatasetsOverview, downloadDatasetCsv } = require('../controllers/databaseController');
const { verifyToken, requireRole } = require('../middlewares/auth');

// Protect all database and dataset export endpoints with ADMIN authentication
router.use(verifyToken);
router.use(requireRole('ADMIN'));

// Administrative endpoint to inspect database dataset architecture and statistics
router.get('/datasets', getDatasetsOverview);

// Direct download of any dataset in CSV format (e.g. /export/tokens/csv, /export/users/csv)
router.get('/export/:dataset/csv', downloadDatasetCsv);

module.exports = router;
