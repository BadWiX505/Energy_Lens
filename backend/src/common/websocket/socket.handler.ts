import { Server } from 'socket.io';
import { EnergyMetricsPayload, AlertEventPayload, TipEventPayload, ScoreEarnedPayload } from './socket.types';

/**
 * Global socket handler instance - initialized by socket.manager.ts
 */
let socketServer: Server | null = null;

/**
 * Initialize the socket handler with the Socket.IO server instance
 */
export const initializeSocketHandler = (io: Server) => {
  socketServer = io;
  console.log('[SocketHandler] Initialized with Socket.IO server');
};

/**
 * Get the current socket server instance
 */
export const getSocketServer = (): Server => {
  if (!socketServer) {
    throw new Error('Socket server not initialized. Call initializeSocketHandler first.');
  }
  return socketServer;
};

/**
 * Emit energy metrics to a specific device room
 * Room: device/{deviceId}
 */
export const emitEnergyMetrics = (deviceId: string, payload: EnergyMetricsPayload) => {
  if (!socketServer) {
    console.warn('[SocketHandler] Socket server not initialized, skipping energy metrics emission');
    return;
  }

  const room = `device/${deviceId}`;
  socketServer.to(room).emit('energy:metrics', payload);
  console.log(`[SocketHandler] Emitted energy:metrics to room ${room}`);
};

/**
 * Emit alert event to device and home rooms
 */
export const emitAlert = (payload: AlertEventPayload) => {
  if (!socketServer) {
    console.warn('[SocketHandler] Socket server not initialized, skipping alert emission');
    return;
  }

  const rooms: string[] = [];

  if (payload.deviceId) {
    rooms.push(`device/${payload.deviceId}`);
  }

  if (payload.homeId) {
    rooms.push(`home/${payload.homeId}`);
  }

  // If neither device nor home specified, skip emission
  if (rooms.length === 0) {
    console.warn('[SocketHandler] Alert has no device or home ID, skipping emission', payload);
    return;
  }

  rooms.forEach((room) => {
    socketServer!.to(room).emit('alert:received', payload);
  });

  console.log(`[SocketHandler] Emitted alert:received to rooms: ${rooms.join(', ')}`);
};

/**
 * Emit tip event to user, home, or device rooms
 */
export const emitTip = (payload: TipEventPayload) => {
  if (!socketServer) {
    console.warn('[SocketHandler] Socket server not initialized, skipping tip emission');
    return;
  }

  const rooms: string[] = [];

  if (payload.userId) {
    rooms.push(`user/${payload.userId}`);
  }

  if (payload.homeId) {
    rooms.push(`home/${payload.homeId}`);
  }

  if (payload.deviceId) {
    rooms.push(`device/${payload.deviceId}`);
  }

  // If no target specified, skip emission
  if (rooms.length === 0) {
    console.warn('[SocketHandler] Tip has no user, home, or device ID, skipping emission', payload);
    return;
  }

  rooms.forEach((room) => {
    socketServer!.to(room).emit('tip:received', payload);
  });

  console.log(`[SocketHandler] Emitted tip:received to rooms: ${rooms.join(', ')}`);
};

/**
 * Emit score:earned to the home room when a goal or achievement awards points
 */
export const emitScoreEarned = (payload: ScoreEarnedPayload) => {
  if (!socketServer) {
    console.warn('[SocketHandler] Socket server not initialized, skipping score:earned emission');
    return;
  }
  const room = `home/${payload.homeId}`;
  socketServer.to(room).emit('score:earned', payload);
  console.log(`[SocketHandler] Emitted score:earned (+${payload.score} pts) to room ${room}`);
};

/**
 * Emit to all clients in a specific room
 * Flexible utility for custom events
 */
export const emitToRoom = (room: string, eventName: string, payload: any) => {
  if (!socketServer) {
    console.warn('[SocketHandler] Socket server not initialized, skipping room emission');
    return;
  }

  socketServer.to(room).emit(eventName, payload);
  console.log(`[SocketHandler] Emitted ${eventName} to room ${room}`);
};

/**
 * Emit to all connected clients (broadcast)
 */
export const broadcastEvent = (eventName: string, payload: any) => {
  if (!socketServer) {
    console.warn('[SocketHandler] Socket server not initialized, skipping broadcast');
    return;
  }

  socketServer.emit(eventName, payload);
  console.log(`[SocketHandler] Broadcasted ${eventName} to all clients`);
};

/**
 * Get socket server connection count
 */
export const getConnectedClientsCount = (): number => {
  if (!socketServer) {
    return 0;
  }
  return socketServer.engine.clientsCount;
};

/**
 * Get rooms and their client counts
 */
export const getRoomsInfo = (): Record<string, number> => {
  if (!socketServer) {
    return {};
  }

  const roomsInfo: Record<string, number> = {};
  socketServer.sockets.adapter.rooms.forEach((clients, room) => {
    roomsInfo[room] = clients.size;
  });

  return roomsInfo;
};
