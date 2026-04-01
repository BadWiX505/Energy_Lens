import { AlertEventPayload } from '../socket.types';
import { emitAlert } from '../socket.handler';

/**
 * Emit alert event to device and/or home rooms
 * Extensible alert emitter that supports device-level and home-level alerts
 *
 * @param payload - Alert event payload with deviceId and/or homeId
 *
 * @example
 * // Device-specific alert
 * emitAlertEvent({
 *   alertId: 'alert-123',
 *   deviceId: 'energy_meter_001',
 *   title: 'High Voltage',
 *   description: 'Voltage exceeded 250V',
 *   severity: 'high',
 *   timestamp: new Date().toISOString(),
 * });
 *
 * @example
 * // Home-wide alert
 * emitAlertEvent({
 *   alertId: 'alert-456',
 *   homeId: 'home-001',
 *   title: 'Overuse Alert',
 *   description: 'Energy consumption exceeded threshold',
 *   severity: 'medium',
 *   timestamp: new Date().toISOString(),
 * });
 */
export const emitAlertEvent = (payload: AlertEventPayload) => {
  try {
    if (!payload.deviceId && !payload.homeId) {
      console.warn('[AlertSocket] Alert has no deviceId or homeId, cannot emit:', payload);
      return;
    }

    emitAlert(payload);
  } catch (error) {
    console.error('[AlertSocket] Error emitting alert:', error);
  }
};

/**
 * Parse and emit alert from domain event (future integration with alerts module)
 * Placeholder for converting domain alerts to WebSocket events
 *
 * @param alertData - Alert data from alerts domain module
 */
export const emitAlertFromDomain = (alertData: any) => {
  // TODO: Implement when alerts module is ready to emit domain events
  console.warn('[AlertSocket] emitAlertFromDomain not yet implemented');
};

/**
 * Bulk emit alerts (future use for batch operations)
 *
 * @param payloads - Array of alert payloads
 */
export const emitAlertsBatch = (payloads: AlertEventPayload[]) => {
  payloads.forEach((payload) => {
    emitAlertEvent(payload);
  });

  console.log(`[AlertSocket] Emitted ${payloads.length} alert events`);
};
