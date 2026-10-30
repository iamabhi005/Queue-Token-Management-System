const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const User = require('../models/User');

/**
 * Validates whether a request parameter is a valid 24-char hexadecimal MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id) || String(new mongoose.Types.ObjectId(id)) !== id) {
      return next(
        new AppError(
          `Invalid ID format for parameter '${paramName}': "${id}". Expected a 24-character hexadecimal ObjectId.`,
          400
        )
      );
    }
    next();
  };
};

/**
 * Validates registration input and guards against privilege escalation
 */
const validateRegister = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    return next(new AppError('Name is required and must be between 2 and 100 characters.', 400));
  }

  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!cleanEmail || cleanEmail.length > 150 || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
    return next(new AppError('A valid email address (max 150 characters) is required.', 400));
  }

  if (!password || typeof password !== 'string' || password.length < 6 || password.length > 128) {
    return next(new AppError('Password is required and must be between 6 and 128 characters.', 400));
  }

  if (role && !['ADMIN', 'STAFF', 'CUSTOMER'].includes(role)) {
    return next(new AppError('Role must be one of ADMIN, STAFF, or CUSTOMER.', 400));
  }

  next();
};

/**
 * Validates login input
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || !email.trim()) {
    return next(new AppError('A valid email address is required.', 400));
  }

  if (!password || typeof password !== 'string' || !password) {
    return next(new AppError('Password is required.', 400));
  }

  if (email.length > 150 || password.length > 128) {
    return next(new AppError('Invalid credentials format.', 400));
  }

  next();
};

/**
 * Validates customer token generation input
 */
const validateCreateToken = (req, res, next) => {
  const { customerName, serviceId } = req.body;

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2 || customerName.trim().length > 60) {
    return next(new AppError('Customer name is required and must be between 2 and 60 characters.', 400));
  }

  // Strip dangerous HTML/script injection tags
  if (/<[a-z][\s\S]*>/i.test(customerName)) {
    return next(new AppError('Customer name contains disallowed markup characters.', 400));
  }

  if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
    return next(new AppError('A valid 24-character serviceId ObjectId is required.', 400));
  }

  next();
};

/**
 * Validates calling next token (staff operation)
 */
const validateCallNextToken = (req, res, next) => {
  const { counterId, serviceId } = req.body;

  if (!counterId && !serviceId) {
    return next(new AppError('Either counterId or serviceId is required to call next token.', 400));
  }

  if (counterId && !mongoose.Types.ObjectId.isValid(counterId)) {
    return next(new AppError('counterId must be a valid 24-character hexadecimal ObjectId.', 400));
  }

  if (serviceId && !mongoose.Types.ObjectId.isValid(serviceId)) {
    return next(new AppError('serviceId must be a valid 24-character hexadecimal ObjectId.', 400));
  }

  next();
};

/**
 * Validates service creation
 */
const validateCreateService = (req, res, next) => {
  const { name, description, averageServiceTime } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return next(new AppError('Service name is required and must be between 2 and 80 characters.', 400));
  }

  if (description && (typeof description !== 'string' || description.length > 500)) {
    return next(new AppError('Service description cannot exceed 500 characters.', 400));
  }

  if (averageServiceTime !== undefined) {
    const num = Number(averageServiceTime);
    if (isNaN(num) || num < 1 || num > 480) {
      return next(new AppError('averageServiceTime must be a number between 1 and 480 minutes.', 400));
    }
  }

  next();
};

/**
 * Validates counter creation
 */
const validateCreateCounter = (req, res, next) => {
  const { name, serviceId } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50) {
    return next(new AppError('Counter name is required and must be between 1 and 50 characters.', 400));
  }

  if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
    return next(new AppError('A valid 24-character serviceId ObjectId is required.', 400));
  }

  next();
};

/**
 * Validates AI chat message
 */
const validateChatMessage = (req, res, next) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return next(new AppError('Please provide a valid text message for the AI assistant.', 400));
  }

  if (message.length > 1000) {
    return next(new AppError('Chat message is too long (maximum 1,000 characters).', 400));
  }

  next();
};

module.exports = {
  validateObjectId,
  validateRegister,
  validateLogin,
  validateCreateToken,
  validateCallNextToken,
  validateCreateService,
  validateCreateCounter,
  validateChatMessage
};
