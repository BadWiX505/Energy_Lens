import { Server as HTTPServer } from 'http';
import { socketManager } from './socket.manager';

/**
 * Initialize WebSocket server and attach to HTTP server
 * Called during application startup in server.ts
 */
export const initializeWebSocketServer = (httpServer: HTTPServer) => {
  try {
    const io = socketManager.initialize(httpServer);
    console.log('[SocketServer] WebSocket server initialized successfully');
    return io;
  } catch (error) {
    console.error('[SocketServer] Failed to initialize WebSocket server:', error);
    throw error;
  }
};

/**
 * Export socket manager for use throughout the application
 */
export { socketManager };

