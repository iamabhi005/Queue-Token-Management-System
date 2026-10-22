const express = require('express');
const router = express.Router();
const { chatWithAI, getSuggestions } = require('../controllers/aiController');

// Public AI Assistant Endpoints
router.post('/chat', chatWithAI);
router.get('/suggestions', getSuggestions);

module.exports = router;
