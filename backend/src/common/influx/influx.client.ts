// write-points.js
import { InfluxDBClient} from '@influxdata/influxdb3-client';

/**
 * Set InfluxDB credentials.
 */
const host = process.env.INFLUX_HOST ?? '';
const token = process.env.INFLUX_TOKEN;

/**
 * Write line protocol to InfluxDB using the JavaScript client library.
 */

export const client = new InfluxDBClient({ host, token });

process.on('SIGINT', async () => {
    await client.close();
    process.exit(0);
});
