// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4OTNiNWFmLWQ5OGUtNDEyZi1hNDU2LWJiNmY5ODUyZTE4NyIsImVtYWlsIjoiaG91c3NhbW5hb3VhbGkwNEBnbWFpbC5jb20iLCJpYXQiOjE3NzQ5NjcyODksImV4cCI6MTc3NTA1MzY4OX0.HWr31wq_HYUhG36hwsNPDinqz3-FWAHlr_GveONl2e0"
import { io } from 'socket.io-client';

export class SocketClient {
  constructor(options = {}) {
    this.options = {
      serverUrl: 'http://localhost:3001',
      token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImQ4OTNiNWFmLWQ5OGUtNDEyZi1hNDU2LWJiNmY5ODUyZTE4NyIsImVtYWlsIjoiaG91c3NhbW5hb3VhbGkwNEBnbWFpbC5jb20iLCJpYXQiOjE3NzQ5NjcyODksImV4cCI6MTc3NTA1MzY4OX0.HWr31wq_HYUhG36hwsNPDinqz3-FWAHlr_GveONl2e0",
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      ...options,
    };

    this.socket = null;
  }

  connect() {
    if (this.socket && this.socket.connected) {
      console.log('[Client] Already connected');
      return;
    }

    this.socket = io(this.options.serverUrl, {
      transports: this.options.transports,
      autoConnect: this.options.autoConnect,
      reconnection: this.options.reconnection,
      auth: {
        token: this.options.token,
      },
    });

    this.registerEvents();
  }

  registerEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Client] Connected:', this.socket.id);
    });

    this.socket.on('connected', (data) => {
      console.log('[Client] Server connected event:', data);
    });
    this.socket.on('energy:metrics', (data) => {
    console.log('[Client] Notification:', data);
   });
    this.socket.on('disconnect', (reason) => {
      console.log('[Client] Disconnected:', reason);
    });

    this.socket.on('disconnected', (data) => {
      console.log('[Client] Server disconnect event:', data);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Client] Connection error:', error.message);
    });

    this.socket.on('error', (error) => {
      console.error('[Client] Socket error:', error);
    });
  }

  subscribe(room) {
    if (!this.socket) return;
    this.socket.emit('subscribe', room);
    console.log('[Client] Subscribed to:', room);
  }

  unsubscribe(room) {
    if (!this.socket) return;
    this.socket.emit('unsubscribe', room);
    console.log('[Client] Unsubscribed from:', room);
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    console.log('[Client] Disconnected manually');
  }
}

