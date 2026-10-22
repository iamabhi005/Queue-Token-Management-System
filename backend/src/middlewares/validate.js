const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

/**
 * Validates whether a request parameter is a valid 24-char MongoDB ObjectId
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
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
 * Request body validators
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, role } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return next(new AppError('Name is required and must be at least 2 characters.', 400));
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return next(new AppError('A valid email address is required.', 400));
  }
  if (!password || password.length < 6) {
    return next(new AppError('Password is required and must be at least 6 characters.', 400));
  }
  if (role && !['ADMIN', 'STAFF', 'CUSTOMER'].includes(role)) {
    return next(new AppError('Role must be one of ADMIN, STAFF, or CUSTOMER.', 400));
  }
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Both email and password are required.', 400));
  }
  next();
};

const validateCreateToken = (req, res, next) => {
  const { customerName, serviceId } = req.body;
  if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
    return next(new AppError('Customer name is required and must be at least 2 characters.', 400));
  }
  if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
    return next(new AppError('A valid 24-character serviceId ObjectId is required.', 400));
  }
  next();
};

const validateCreateService = (req, res, next) => {
  const { name, averageServiceTime } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return next(new AppError('Service name is required and must be at least 2 characters.', 400));
  }
  if (averageServiceTime !== undefined && (isNaN(averageServiceTime) || Number(averageServiceTime) < 1)) {
    return next(new AppError('averageServiceTime must be a number greater than or equal to 1 minute.', 400));
  }
  next();
};

const validateCreateCounter = (req, res, next) => {
  const { name, serviceId } = req.body;
  if (!name || typeof name !== 'string' || name.trim().length < 1) {
    return next(new AppError('Counter name is required.', 400));
  }
  if (!serviceId || !mongoose.Types.ObjectId.isValid(serviceId)) {
    return next(new AppError('A valid 24-character serviceId ObjectId is required.', 400));
  }
  next();
};

module.exports = {
  validateObjectId,
  validateRegister,
  validateLogin,
  validateCreateToken,
  validateCreateService,
  validateCreateCounter
};
