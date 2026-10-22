const { processChatMessage, getLiveQueueContext } = require('../services/aiService');
const AppError = require('../utils/AppError');

/**
 * POST /api/ai/chat
 * Send a message to SmartQueue AI Assistant
 */
const chatWithAI = async (req, res, next) => {
  try {
    const { message, conversationHistory, tokenId } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return next(new AppError('Please provide a valid text message for the AI assistant.', 400));
    }

    const result = await processChatMessage({
      message: message.trim(),
      conversationHistory: Array.isArray(conversationHistory) ? conversationHistory : [],
      userTokenId: tokenId || null
    });

    res.status(200).json({
      success: true,
      data: {
        reply: result.reply,
        source: result.source,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ai/suggestions
 * Returns suggested quick questions for the customer
 */
const getSuggestions = async (req, res, next) => {
  try {
    const suggestions = [
      "How long is the wait right now?",
      "What documents do I need to bring?",
      "What services are available today?",
      "Where is my ticket being served?",
      "What are the operating hours?"
    ];

    res.status(200).json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  chatWithAI,
  getSuggestions
};
