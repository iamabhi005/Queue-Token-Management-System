const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'STAFF'
    });

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

    // Retrieve user and check password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return next(new AppError('Invalid email or password.', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', 401));
    }

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
