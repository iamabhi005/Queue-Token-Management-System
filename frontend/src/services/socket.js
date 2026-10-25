import { io } from 'socket.io-client';

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL && import.meta.env.VITE_SOCKET_URL !== '/')
  ? import.meta.env.VITE_SOCKET_URL
  : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5001');

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  auth: (cb) => {
    const token = localStorage.getItem('smartqueue_token');
    cb({ token });
  }
});

socket.on('connect', () => {
  console.log('[Socket.IO] Connected to SmartQueue backend server:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('[Socket.IO] Disconnected from SmartQueue backend:', reason);
});

socket.on('connect_error', (err) => {
  console.warn('[Socket.IO] Connection error:', err.message);
});

/**
 * Join room helper (e.g. service:123, counter:456, room:display)
 */
export const joinQueueRoom = (roomName) => {
  if (socket.connected) {
    socket.emit('join:room', roomName);
  } else {
    socket.once('connect', () => {
      socket.emit('join:room', roomName);
    });
  }
};

/**
 * Leave room helper
 */
export const leaveQueueRoom = (roomName) => {
  if (socket.connected) {
    socket.emit('leave:room', roomName);
  }
};
