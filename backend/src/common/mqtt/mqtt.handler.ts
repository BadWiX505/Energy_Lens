import { writePoint } from "../influx/influx.handler";


export const mqttMessageHandler = (receivedTopic: string, payload: Buffer) => {
   if (receivedTopic === 'home/energy/data') {
    try {
      const data = JSON.parse(payload.toString());
      if (!writePoint('power_metrics_v2', data.tags, data.metrics)) {
        console.error('Failed to write data to InfluxDB');
      }
      else {
        console.log('Data written to InfluxDB successfully');
      }
    } catch (error) {
      console.error('Failed to parse message payload as JSON:', error);
    }
  }
}