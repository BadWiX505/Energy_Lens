import {client} from './influx.client';
import {Point} from '@influxdata/influxdb3-client';

const database = process.env.INFLUX_DATABASE;

export async function writePoint(measurement: string, tags: Record<string, string>, fields: Record<string, number | string>, timestamp: number = new Date().getTime() / 1000) {
  const point = Point.measurement(measurement);
    for (const [key, value] of Object.entries(tags)) {  
        point.setTag(key, value);
    }
    for (const [key, value] of Object.entries(fields)) {
        if (typeof value === 'number') {
            if (Number.isInteger(value)) {
                point.setIntegerField(key, value);
            } else {
                point.setFloatField(key, value);
            }
        } else if (typeof value === 'string') {
            point.setStringField(key, value);
        }
    }
    point.setTimestamp(timestamp);
    
  try {
    await client.write([point], database, '', { precision: 's' });
    return true;
  } catch (error) {
    console.error(`Error writing data to InfluxDB: ${error}`);
    return false;
  }
}
