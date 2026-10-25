const express = require('express');
const router = express.Router();
const { chatWithAI, getSuggestions } = require('../controllers/aiController');
const { validateChatMessage } = require('../middlewares/validate');
const { aiChatLimiter } = require('../middlewares/rateLimiter');

// Public AI Assistant Endpoints
router.post('/chat', aiChatLimiter, validateChatMessage, chatWithAI);
router.get('/suggestions', getSuggestions);

module.exports = router;
