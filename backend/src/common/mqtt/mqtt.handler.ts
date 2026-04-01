import { writePoint } from "../influx/influx.handler";
import { eventBus } from "../../events/eventBus";


export const mqttMessageHandler = (receivedTopic: string, payload: Buffer) => {
   if (receivedTopic === 'home/energy/data') {
    try {
      const data = JSON.parse(payload.toString());
      
      // // Write to InfluxDB
      // if (!writePoint('power_metrics_v2', data.tags, data.metrics)) {
      //   console.error('[MQTT] Failed to write data to InfluxDB');
      // } else {
      //   console.log('[MQTT] Data written to InfluxDB successfully');
      // }

      // Emit to EventBus for WebSocket real-time distribution
      const deviceId = data.tags?.device_id || 'unknown';
      eventBus.emit('event:energy:received', {
        deviceId,
        tags: data.tags,
        metrics: data.metrics,
        timestamp: data.timestamp || new Date().toISOString(),
      });
      
    } catch (error) {
      console.error('[MQTT] Failed to parse message payload as JSON:', error);
    }
  }
}