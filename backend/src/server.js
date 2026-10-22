require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 5001;

// Connect to MongoDB and start HTTP + Socket.IO server
connectDB().then(() => {
  const server = http.createServer(app);
  
  // Initialize Socket.IO on the server
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`[SmartQueue API] HTTP + Socket.IO server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    console.log(`[SmartQueue API] Health check ready at: http://localhost:${PORT}/api/health`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('[FATAL] Unhandled Rejection:', err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
});
