import app from './app';
import { createServer } from 'http';
import { initializeWebSocketServer } from './common/websocket/socket.server';
import { initializeSocketBridge } from './common/websocket/socket.bridge';

const PORT = process.env.PORT || 3001;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize WebSocket server
initializeWebSocketServer(httpServer);

// Initialize EventBus-to-WebSocket bridge
initializeSocketBridge();

// Start listening
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 WebSocket ready for real-time data streaming`);
});