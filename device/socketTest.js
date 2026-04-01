import {SocketClient}   from './socketClient.js';

const client = new SocketClient();

client.connect();
// subscribe after 2 seconds

  client.subscribe('device/550e8400-e29b-41d4-a716-446655440000');

//