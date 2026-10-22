const AppError = require('../utils/AppError');

/**
 * Handle Mongoose Invalid ObjectId (CastError)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: "${err.value}". Expected a valid ObjectId.`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose Duplicate Key (E11000)
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value '${value}' for field '${field}'. Please use another value.`;
  return new AppError(message, 409);
};

/**
 * Handle Mongoose Schema Validation Errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Validation error: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.statusCode = err.statusCode || 500;
  error.status = err.status || 'error';

  // Specific database error normalization
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = new AppError('Invalid authentication token.', 401);
  if (err.name === 'TokenExpiredError') error = new AppError('Authentication token has expired.', 401);

  // Development vs Production response formatting
  const response = {
    success: false,
    status: error.status,
    message: error.message || 'An unexpected internal server error occurred.'
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.originalError = err.name;
  }

  res.status(error.statusCode).json(response);
};

/**
 * 404 Catch-All Middleware for undefined routes
 */
const notFoundHandler = (req, res, next) => {
  next(new AppError(`The requested endpoint '${req.originalUrl}' does not exist on this server.`, 404));
};

module.exports = {
  errorHandler,
  notFoundHandler
};
