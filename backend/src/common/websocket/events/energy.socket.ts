import { EnergyMetricsPayload, MQTTDevicePayload } from '../socket.types';
import { emitEnergyMetrics } from '../socket.handler';

/**
 * Emit energy metrics to device room
 * Bridge between MQTT payload and WebSocket client
 *
 * @param deviceId - Target device ID for room subscription (device/{deviceId})
 * @param mqttPayload - Raw MQTT payload with tags and metrics
 */
export const emitEnergyMetricsEvent = (deviceId: string, mqttPayload: MQTTDevicePayload) => {
  try {
    const payload: EnergyMetricsPayload = {
      deviceId,
      timestamp: mqttPayload.timestamp,
      tags: mqttPayload.tags,
      metrics: mqttPayload.metrics,
    };

    emitEnergyMetrics(deviceId, payload);
  } catch (error) {
    console.error('[EnergySocket] Error emitting energy metrics:', error);
  }
};

/**
 * Alternative: Emit energy metrics extracted from device_id in MQTT tags
 * Useful when tags contain device_id property
 *
 * @param mqttPayload - Raw MQTT payload with tags containing device_id
 */
export const emitEnergyMetricsFromTags = (mqttPayload: MQTTDevicePayload) => {
  const deviceId = mqttPayload.tags.device_id;

  if (!deviceId) {
    console.error('[EnergySocket] MQTT payload missing device_id in tags');
    return;
  }

  emitEnergyMetricsEvent(deviceId, mqttPayload);
};

/**
 * Bulk emit for multiple devices (future use)
 *
 * @param payloads - Array of MQTT payloads
 */
export const emitEnergyMetricsBatch = (payloads: MQTTDevicePayload[]) => {
  payloads.forEach((payload) => {
    emitEnergyMetricsFromTags(payload);
  });

  console.log(`[EnergySocket] Emitted ${payloads.length} energy metrics events`);
};
