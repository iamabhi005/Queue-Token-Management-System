const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');

/**
 * Generate a signed JWT token
 */
const signToken = (user) => {
  const secret = process.env.JWT_SECRET || 'smartqueue_dev_jwt_secret_key_2026_super_secure';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role, name: user.name },
    secret,
    { expiresIn }
  );
};

/**
 * POST /api/auth/register
 * Register a new user (ADMIN, STAFF, or CUSTOMER)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email already registered
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists.', 409));
    }

    // Hash password with bcrypt (12 salt rounds)
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // If caller is authenticated as ADMIN, allow role specification; otherwise default to CUSTOMER
    const assignedRole = req.adminCaller ? (role || 'STAFF') : 'CUSTOMER';

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: assignedRole
    });

    // Record in audit log dataset
    await ActivityLog.create({
      action: 'REGISTER',
      dataset: 'users',
      details: { userId: newUser._id, email: newUser.email, role: newUser.role },
      performedBy: newUser.email
    }).catch(err => console.warn('[ActivityLog] Could not log registration:', err.message));

    const token = signToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      data: {
        user: newUser
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticate user and issue JWT token
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Both email and password are required.', 400));
    }

    const cleanEmail = email.toString().toLowerCase().trim();

    // Retrieve user including hidden passwordHash for comparison
    const user = await User.findOne({ email: cleanEmail }).select('+passwordHash');
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

    // Record in audit log dataset
    await ActivityLog.create({
      action: 'LOGIN',
      dataset: 'users',
      details: { userId: user._id, email: user.email, role: user.role },
      performedBy: user.email
    }).catch(err => console.warn('[ActivityLog] Could not log login:', err.message));

    const token = signToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login
};
