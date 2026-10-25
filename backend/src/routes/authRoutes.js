const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middlewares/validate');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');

// Public Auth Endpoints protected with rate limiting & input validation
router.post('/register', registerLimiter, validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);

module.exports = router;
