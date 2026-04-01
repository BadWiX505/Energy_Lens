import { eventBus } from '../../events/eventBus';
import { emitEnergyMetricsFromTags } from './events/energy.socket';
import { MQTTDevicePayload } from './socket.types';

/**
 * Initialize WebSocket-EventBus bridge
 * Subscribes to EventBus energy events and emits them through WebSocket to connected clients
 * Called during server initialization
 */
export const initializeSocketBridge = () => {
  /**
   * Listen for energy metrics events from MQTT handler
   * Event structure: { deviceId, tags, metrics, timestamp }
   */
  eventBus.on('event:energy:received', (payload: MQTTDevicePayload) => {
    try {
      emitEnergyMetricsFromTags(payload);
    } catch (error) {
      console.error('[SocketBridge] Error processing energy event:', error);
    }
  });

  /**
   * Future: Listen for alert events from domain
   */
  eventBus.on('event:alert:created', (payload: any) => {
    console.log('[SocketBridge] Alert event received (stub):', payload);
    // TODO: Implement emitAlertEvent(payload) when alerts module emits these events
  });

  /**
   * Future: Listen for tip events from domain
   */
  eventBus.on('event:tip:generated', (payload: any) => {
    console.log('[SocketBridge] Tip event received (stub):', payload);
    // TODO: Implement emitTipEvent(payload) when tips module emits these events
  });

  console.log('[SocketBridge] WebSocket bridge initialized - listening for EventBus events');
};

/**
 * Clean up bridge listeners (optional, for graceful shutdown)
 */
export const cleanupSocketBridge = () => {
  eventBus.removeAllListeners('event:energy:received');
  eventBus.removeAllListeners('event:alert:created');
  eventBus.removeAllListeners('event:tip:generated');
  console.log('[SocketBridge] Bridge listeners cleaned up');
};
