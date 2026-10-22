const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Middleware to verify JWT token from Authorization header (Bearer <token>)
 */
const verifyToken = async (req, res, next) => {
  try {
    let token = null;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Authentication required. Please provide a valid Bearer token.', 401));
    }

    const secret = process.env.JWT_SECRET || 'smartqueue_dev_jwt_secret_key_2026_super_secure';
    const decoded = jwt.verify(token, secret);

    // Verify user still exists in database
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Your token has expired. Please log in again.', 401));
    }
    return next(error);
  }
};

/**
 * Role-Based Access Control (RBAC) middleware
 * Prevents unauthorized roles (like CUSTOMER) from accessing protected admin endpoints
 * @param  {...string} allowedRoles - e.g. 'ADMIN', 'STAFF'
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: [${allowedRoles.join(' or ')}]. Your role: ${req.user ? req.user.role : 'Unauthenticated'}`,
          403
        )
      );
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
