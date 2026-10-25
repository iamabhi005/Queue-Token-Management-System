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

// const PORT = process.env.PORT || 5001;
// server.listen(PORT, "0.0.0.0", () => {
//   console.log(`SmartQueue API running on port ${PORT}`);
// });


// Connect to MongoDB and start HTTP + Socket.IO server
connectDB().then(() => {
  const server = http.createServer(app);

  // Initialize Socket.IO on the server
  initSocket(server);

  const PORT = process.env.PORT || 5001;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`SmartQueue API running on port ${PORT}`);
  });


  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('[FATAL] Unhandled Rejection:', err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });
});
