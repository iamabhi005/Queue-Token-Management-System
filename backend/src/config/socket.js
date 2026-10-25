const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || origin === process.env.CLIENT_URL) {
          return callback(null, true);
        }
        if (/^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Socket.IO origin '${origin}' blocked by security policy.`));
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  // Optional socket authentication middleware
  // If client provides auth token, verify it and attach user; otherwise allow guest connection
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (token) {
        const secret = process.env.JWT_SECRET || 'smartqueue_dev_jwt_secret_key_2026_super_secure';
        const decoded = jwt.verify(token, secret);
        const user = await User.findById(decoded.id).select('name email role');
        if (user) {
          socket.user = user;
        }
      }
      next();
    } catch (err) {
      // Allow guest connections for public display & customers, but socket.user will be undefined
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id} (Role: ${socket.user ? socket.user.role : 'GUEST'})`);

    // 1. Join room for specific service, counter, or display screen
    socket.on('join:room', (roomName) => {
      if (!roomName || typeof roomName !== 'string') return;
      socket.join(roomName);
      console.log(`[Socket.IO] Client ${socket.id} joined room: ${roomName}`);
    });

    // 2. Leave room
    socket.on('leave:room', (roomName) => {
      if (!roomName || typeof roomName !== 'string') return;
      socket.leave(roomName);
      console.log(`[Socket.IO] Client ${socket.id} left room: ${roomName}`);
    });

    // 3. Reject unauthenticated/unauthorized socket actions (Requirement 8 & 9)
    socket.on('admin:action', (data, callback) => {
      if (!socket.user || !['ADMIN', 'STAFF'].includes(socket.user.role)) {
        if (typeof callback === 'function') {
          callback({
            success: false,
            message: 'Unauthorized: Administrative actions require authenticated staff or admin role.'
          });
        }
        return;
      }
      if (typeof callback === 'function') {
        callback({ success: true, message: 'Action authorized.' });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    console.warn('[Socket.IO] getIO called before socket initialization.');
  }
  return io;
}

/**
 * Emit queue updates globally and to specific service / counter rooms
 */
function emitQueueUpdate(eventType, payload) {
  if (!io) return;

  // 1. Global broadcast for display screens & general queue sync
  io.emit(eventType, payload);
  io.emit('QUEUE_UPDATED', { type: eventType, data: payload, timestamp: new Date() });

  // 2. Targeted room broadcast by service ID (Requirement 7)
  const serviceId = payload.service?.id || payload.token?.serviceId?.id || payload.token?.serviceId?._id || payload.token?.serviceId;
  if (serviceId) {
    io.to(`service:${serviceId}`).emit(eventType, payload);
  }

  // 3. Targeted room broadcast by counter ID
  const counterId = payload.counter?.id || payload.counter?._id || payload.token?.counterId?.id || payload.token?.counterId?._id || payload.token?.counterId;
  if (counterId) {
    io.to(`counter:${counterId}`).emit(eventType, payload);
  }

  // 4. Room broadcast for public hall displays
  io.to('room:display').emit(eventType, payload);
}

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdate
};
