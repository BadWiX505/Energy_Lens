import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { AuthenticatedSocket } from './socket.types';
import { authenticateSocket, handleSubscribe, handleUnsubscribe } from './socket.middlewares';
import { initializeSocketHandler } from './socket.handler';

/**
 * Socket Manager - handles Socket.IO server initialization and connection management
 * Singleton pattern - one instance per application lifecycle
 */
class SocketManager {
  private io: SocketIOServer | null = null;
  private initialized = false;

  /**
   * Initialize Socket.IO server attached to HTTP server
   * @param httpServer - HTTP server instance (created from Express app)
   * @returns Socket.IO server instance
   */
  public initialize(httpServer: HTTPServer): SocketIOServer {
    if (this.initialized && this.io) {
      console.log('[SocketManager] Socket.IO already initialized');
      return this.io;
    }

    // Create Socket.IO server with CORS configuration
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 60000,
    });

    // Apply authentication middleware
    this.io.use((socket: Socket, next) => {
      authenticateSocket(socket as AuthenticatedSocket, next);
    });

    // Handle client connections
    this.io.on('connection', (socket: Socket) => {
      const authSocket = socket as AuthenticatedSocket;
      console.log(`[SocketManager] Client connected: ${socket.id} | User: ${authSocket.userId}`);

      // Emit connected event to client
      socket.emit('connected', {
        socketId: socket.id,
        userId: authSocket.userId,
        timestamp: new Date().toISOString(),
      });

      /**
       * Handle subscription requests from client
       */
      socket.on('subscribe', (room: string) => {
        handleSubscribe(authSocket, room);
      });

      /**
       * Handle unsubscription requests from client
       */
      socket.on('unsubscribe', (room: string) => {
        handleUnsubscribe(authSocket, room);
      });

      /**
       * Handle client disconnect
       */
      socket.on('disconnect', () => {
        console.log(
          `[SocketManager] Client disconnected: ${socket.id} | User: ${authSocket.userId}`
        );
        socket.emit('disconnected', {
          socketId: socket.id,
          timestamp: new Date().toISOString(),
        });
      });

      /**
       * Error handler
       */
      socket.on('error', (error: Error) => {
        console.error(`[SocketManager] Socket error on ${socket.id}:`, error);
      });
    });

    // Initialize socket handler with the server instance
    initializeSocketHandler(this.io);

    this.initialized = true;
    console.log('[SocketManager] Socket.IO server initialized');
    return this.io;
  }

  /**
   * Get the Socket.IO server instance
   */
  public getServer(): SocketIOServer {
    if (!this.io) {
      throw new Error('Socket.IO server not initialized. Call initialize() first.');
    }
    return this.io;
  }

  /**
   * Check if socket manager is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get total connected clients count
   */
  public getConnectedClientsCount(): number {
    if (!this.io) return 0;
    return this.io.engine.clientsCount;
  }

  /**
   * Shutdown socket manager gracefully
   */
  public async shutdown(): Promise<void> {
    if (this.io) {
      console.log('[SocketManager] Shutting down Socket.IO server...');
      await this.io.close();
      this.io = null;
      this.initialized = false;
      console.log('[SocketManager] Socket.IO server shut down');
    }
  }
}

// Export singleton instance
export const socketManager = new SocketManager();
