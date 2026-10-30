const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const AppError = require('./utils/AppError');

const authRoutes = require('./routes/authRoutes');
const tokenRoutes = require('./routes/tokenRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const adminRoutes = require('./routes/adminRoutes');
const queueRoutes = require('./routes/queueRoutes');
const aiRoutes = require('./routes/aiRoutes');
const databaseRoutes = require('./routes/databaseRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// Security and utility middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Allowed origin validator (Local dev ports, configured CLIENT_URL, Cloudflare tunnels, Vercel)
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // Server-to-server, curl, testing tools
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) return true;
  if (/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin)) return true;
  // Allow all Vercel preview and production deployments
  if (/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  // Allow Railway and Render previews (in case of cross-service calls)
  if (/^https:\/\/[a-z0-9-]+\.up\.railway\.app$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+\.onrender\.com$/.test(origin)) return true;
  return false;
};

// Strict CORS configuration for approved frontend origins
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new AppError(`Origin '${origin}' not permitted by CORS security policy.`, 403));
  },
  credentials: true
}));

// Body parsing with safe size limits to prevent denial-of-service
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// System Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'SmartQueue Backend API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/database', databaseRoutes);

// 404 Route Catch-All
app.use(notFoundHandler);

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
