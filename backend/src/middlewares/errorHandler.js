const AppError = require('../utils/AppError');

/**
 * Strips sensitive database connection strings, passwords, or filesystem paths
 */
const sanitizeErrorMessage = (msg) => {
  if (!msg || typeof msg !== 'string') return 'An error occurred.';
  return msg
    .replace(/mongodb(\+srv)?:\/\/[^\s]+/gi, '[DATABASE_URI_REDACTED]')
    .replace(/\/Users\/[^\s:]+/g, '[FILEPATH_REDACTED]')
    .replace(/jwt_secret[^\s,]*/gi, '[SECRET_REDACTED]');
};

/**
 * Handle Mongoose Invalid ObjectId (CastError)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: "${err.value}". Expected a valid 24-character hexadecimal ObjectId.`;
  return new AppError(message, 400);
};

/**
 * Handle Mongoose Duplicate Key (E11000)
 */
const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue ? err.keyValue[field] : '';
  const message = `Duplicate value '${value}' for field '${field}'. A unique record already exists.`;
  return new AppError(message, 409);
};

/**
 * Handle Mongoose Schema Validation Errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors || {}).map(el => el.message);
  const message = `Validation error: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let error = { ...err };
  error.message = err.message;
  error.name = err.name;
  error.statusCode = err.statusCode || (err.status && typeof err.status === 'number' ? err.status : 500);
  error.status = `${error.statusCode}`.startsWith('4') ? 'fail' : 'error';

  // Handle malformed JSON body
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new AppError('Malformed JSON payload received.', 400);
  }

  // Specific database error normalization
  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = new AppError('Invalid authentication token.', 401);
  if (err.name === 'TokenExpiredError') error = new AppError('Authentication token has expired.', 401);

  // Safe message formatting
  const isOperational = error.isOperational || error.statusCode < 500;
  const safeMessage = isOperational
    ? sanitizeErrorMessage(error.message)
    : 'An unexpected internal server error occurred. Please try again later.';

  const response = {
    success: false,
    status: error.status,
    message: safeMessage
  };

  // Only attach debug details in local development for operational inspection
  if (process.env.NODE_ENV === 'development' && isOperational) {
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
  notFoundHandler,
  sanitizeErrorMessage
};
