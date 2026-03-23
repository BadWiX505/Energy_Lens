import mqtt from 'mqtt';
import dotenv from 'dotenv';
dotenv.config();
// 1. HiveMQ Cloud Connection Details
// You can find these in your HiveMQ Cloud Console under the "Cluster" details
const host = process.env.HIVE_MQ_URL; // Replace with your actual host URL
const port = process.env.HIVE_MQ_PORT; // 8883 is the standard port for secure MQTT (MQTTS)
const clientId = `node_client_${Math.random().toString(16).slice(3)}`;

const connectUrl = `mqtts://${host}:${port}`;

// 2. Setup Connection Options
// HiveMQ Cloud requires authentication, so you must provide credentials configured in the Access Management tab.
const options = {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: process.env.HIVE_MQ_USERNAME, // Replace with your HiveMQ username
  password: process.env.HIVE_MQ_PASSWORD, // Replace with your HiveMQ password
  reconnectPeriod: 1000,
};

console.log('Connecting to HiveMQ Cloud...');
export const client = mqtt.connect(connectUrl, options);

const topic = 'home/energy/data';

// 3. Handle Successful Connection
client.on('connect', () => {
  console.log('Connected to HiveMQ Cloud successfully!');

  // Subscribe to the topic
  client.subscribe([topic], () => {
    console.log(`Subscribed to topic: ${topic}`);
  });
});

// 4. Handle Incoming Messages
client.on('message', (receivedTopic, payload) => {
  console.log(`\n--- New Message Received ---`);
  console.log(`Topic: ${receivedTopic}`);
  console.log(`Payload: ${payload.toString()}`);
  console.log(`----------------------------\n`);
});

// 5. Handle Errors
client.on('error', (error) => {
  console.error('Connection failed:', error);
  client.end();
});