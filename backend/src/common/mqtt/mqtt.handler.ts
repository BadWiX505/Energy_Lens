import { writePoint, queryRows } from "../influx/influx.handler";
import { eventBus } from "../../events/eventBus";
import { alertsEngine } from "../../modules/alerts/alerts.engine";
import { tipsGenerator } from "../../modules/tips/tips.generator";
import { deviceState } from "../config/deviceSate";

const POWER_CHANGE_TRESH = 100;
export const mqttMessageHandler = (receivedTopic: string, payload: Buffer) => {
  if (receivedTopic === 'home/energy/data') {
    try {
      const data = JSON.parse(payload.toString());
      const metricsMesurement = process.env.INFLUX_ENERGY_METRICS_MEASUREMENT || "energy_metrics_v3";
      const powerChangeMesurement = process.env.INFLUX_POWER_CHANGE_MEASUREMENT || "power_change_v2";
      // Evaluate the payload against Static Alert Rules
      alertsEngine.processPayload({
        timestamp: data.timestamp || new Date().toISOString(),
        tags: data.tags || {},
        metrics: data.metrics || {}
      }).catch(err => console.error('[MQTT] Alerts processing error:', err));

      // Write to InfluxDB as energy_metrics measurement
      const timestamp = Math.floor(new Date(data.timestamp || new Date()).getTime() / 1000);
      writePoint(metricsMesurement, data.tags || {}, data.metrics || {}, timestamp)
        .then((success) => {
          if (!success) {
            console.error('[MQTT] [Energy Metrics] Failed to write data to InfluxDB for device:', data.tags?.device_id);
          } else {
            console.log('[MQTT] [Energy Metrics] Data written to InfluxDB successfully for device:', data.tags?.device_id);
          }
        })
        .catch((error) => {
          console.error('[MQTT] [Energy Metrics] InfluxDB write error:', error);
        });

      // Calculate power change and write to InfluxDB as power_change measurement
      const deviceId = data.tags?.device_id || 'unknown';
      const powerChange = deviceState.calculatePowerChange(deviceId, data.metrics.power_watts);
      deviceState.updateDeviceState(deviceId, data.metrics.power_watts);

      if (Math.abs(powerChange) >= POWER_CHANGE_TRESH) {
        writePoint(powerChangeMesurement, data.tags || {}, { deltaPower: powerChange, type: powerChange > 0 ? "ON" : "OFF" }, timestamp)
          .then(async (success) => {
            if (!success) {
              console.error('[MQTT] [Power Change : ', powerChange, '] Failed to write data to InfluxDB for device:', data.tags?.device_id);
            } else {
              console.log('[MQTT] [Power Change : ', powerChange, '] Data written to InfluxDB successfully for device:', data.tags?.device_id);
          }
      })
          .catch((error) => {
            console.error('[MQTT] [Power Change] InfluxDB write error:', error);
          });
      }

      // Emit to EventBus for WebSocket real-time distribution
      eventBus.emit('event:energy:received', {
        deviceId,
        tags: data.tags,
        metrics: data.metrics,
        timestamp: data.timestamp || new Date().toISOString(),
      });

      // Trigger tips generation (non-blocking, fire-and-forget)
      // Tips generation checks interval gating and device caching internally
      // Errors are logged but never block the energy metrics flow
      tipsGenerator.checkAndGenerateTips(deviceId)
        .catch((err) => {
          console.error('[MQTT] Tips generation error (non-blocking):', err);
        });

    } catch (error) {
      console.error('[MQTT] Failed to parse message payload as JSON:', error);
    }
  }
}