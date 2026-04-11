import { eventBus } from '../../events/eventBus';
import { emitEnergyMetricsFromTags } from './events/energy.socket';
import { emitTipEvent } from './events/tips.socket';
import { MQTTDevicePayload, TipEventPayload } from './socket.types';

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
    try {
      if (!payload || !payload.homeId) {
        console.warn('[SocketBridge] Received tip event without homeId:', payload);
        return;
      }

      // Convert domain event to WebSocket event payload
      const tipPayload: TipEventPayload = {
        tipId: payload.tipId,
        homeId: payload.homeId,
        title: payload.title,
        description: payload.description,
        category: payload.categoryTag,
        timestamp: payload.timestamp || new Date().toISOString(),
        metadata: payload.estimatedSavings ? { estimatedSavings: payload.estimatedSavings } : undefined,
      };

      console.log('[SocketBridge] Emitting tip event to home:', payload.homeId);
      emitTipEvent(tipPayload);
    } catch (error) {
      console.error('[SocketBridge] Error processing tip event:', error);
    }
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
