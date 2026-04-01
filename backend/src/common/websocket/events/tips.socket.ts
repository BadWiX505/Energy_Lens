import { TipEventPayload } from '../socket.types';
import { emitTip } from '../socket.handler';

/**
 * Emit tip event to user, home, or device rooms
 * Extensible tip emitter that can target specific scopes
 *
 * @param payload - Tip event payload with userId and/or homeId and/or deviceId
 *
 * @example
 * // User-specific tip
 * emitTipEvent({
 *   tipId: 'tip-123',
 *   userId: 'user-001',
 *   title: 'Energy Saving Tip',
 *   description: 'Consider using LED bulbs for 70% energy savings',
 *   category: 'efficiency',
 *   timestamp: new Date().toISOString(),
 * });
 *
 * @example
 * // Home-wide tip
 * emitTipEvent({
 *   tipId: 'tip-456',
 *   homeId: 'home-001',
 *   title: 'Peak Hours Notice',
 *   description: 'Avoid running heavy appliances during 6-9 PM',
 *   category: 'scheduling',
 *   timestamp: new Date().toISOString(),
 * });
 *
 * @example
 * // Device-specific tip
 * emitTipEvent({
 *   tipId: 'tip-789',
 *   deviceId: 'energy_meter_001',
 *   title: 'Device Efficiency',
 *   description: 'This device is operating below efficiency',
 *   category: 'maintenance',
 *   timestamp: new Date().toISOString(),
 * });
 */
export const emitTipEvent = (payload: TipEventPayload) => {
  try {
    if (!payload.userId && !payload.homeId && !payload.deviceId) {
      console.warn('[TipSocket] Tip has no userId, homeId, or deviceId, cannot emit:', payload);
      return;
    }

    emitTip(payload);
  } catch (error) {
    console.error('[TipSocket] Error emitting tip:', error);
  }
};

/**
 * Parse and emit tip from domain event (future integration with tips module)
 * Placeholder for converting domain tips to WebSocket events
 *
 * @param tipData - Tip data from tips domain module
 */
export const emitTipFromDomain = (tipData: any) => {
  // TODO: Implement when tips module is ready to emit domain events
  console.warn('[TipSocket] emitTipFromDomain not yet implemented');
};

/**
 * Bulk emit tips (future use for batch operations)
 *
 * @param payloads - Array of tip payloads
 */
export const emitTipsBatch = (payloads: TipEventPayload[]) => {
  payloads.forEach((payload) => {
    emitTipEvent(payload);
  });

  console.log(`[TipSocket] Emitted ${payloads.length} tip events`);
};
