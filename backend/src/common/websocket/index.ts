/**
 * WebSocket module - central exports for real-time communication
 */

// Core infrastructure
export { socketManager } from './socket.manager';
export { initializeWebSocketServer } from './socket.server';

// Type definitions
export {
  AuthenticatedSocket,
  JWTPayload,
  MQTTDevicePayload,
  EnergyMetricsPayload,
  AlertEventPayload,
  TipEventPayload,
  ServerToClientEvents,
  ClientToServerEvents,
  RoomType,
  getRoomName,
  ROOM_PATTERNS,
} from './socket.types';

// Middleware & handlers
export {
  authenticateSocket,
  validateRoomSubscription,
  handleSubscribe,
  handleUnsubscribe,
} from './socket.middlewares';

export {
  initializeSocketHandler,
  getSocketServer,
  emitEnergyMetrics,
  emitAlert,
  emitTip,
  emitToRoom,
  broadcastEvent,
  getConnectedClientsCount,
  getRoomsInfo,
} from './socket.handler';

// Event emitters
export { emitEnergyMetricsEvent, emitEnergyMetricsFromTags } from './events/energy.socket';
export { emitAlertEvent } from './events/alerts.socket';
export { emitTipEvent } from './events/tips.socket';

// Bridge
export { initializeSocketBridge, cleanupSocketBridge } from './socket.bridge';
