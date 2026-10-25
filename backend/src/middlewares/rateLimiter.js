const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

/**
 * Factory for creating configured rate limiters
 */
const createLimiter = (options = {}) => {
  const isTest = process.env.NODE_ENV === 'test';

  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: isTest ? 10000 : (options.max || 100),
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(
        new AppError(
          options.message || 'Too many requests from this IP address. Please try again later.',
          429
        )
      );
    },
    skip: (req) => isTest || (typeof options.skip === 'function' && options.skip(req)),
    ...options
  });
};

// 1. Login rate limiter (10 attempts per 15 minutes per IP)
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts from this IP. Please wait 15 minutes before trying again.'
});

// 2. Registration rate limiter (10 registrations per hour per IP)
const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many account registrations from this IP. Please try again in an hour.'
});

// 3. Token generation limiter (30 token requests per 15 minutes per IP)
const tokenCreationLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: 'Token generation limit reached. Please wait a few minutes before issuing more tokens.'
});

// 4. AI Chat rate limiter (40 chat messages per 15 minutes per IP)
const aiChatLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: 'AI chat request limit reached. Please slow down.'
});

module.exports = {
  createLimiter,
  loginLimiter,
  registerLimiter,
  tokenCreationLimiter,
  aiChatLimiter
};
