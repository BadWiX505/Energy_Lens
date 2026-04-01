import { Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedSocket, JWTPayload } from './socket.types';

/**
 * JWT authentication middleware for WebSocket connections
 * Uses the same JWT structure as REST API (id + email)
 * Validates token and optionally verifies user exists in database
 */
export const authenticateSocket = (socket: AuthenticatedSocket, next: (err?: Error) => void) => {
  try {
    // Extract token from various sources
    const authHeader = socket.handshake.headers.authorization;
    const token = socket.handshake.auth.token || authHeader?.split(' ')[1];

    console.log(`[WebSocket] Connection attempt from ${socket.id}`);
    console.log(`[WebSocket] Auth header present: ${!!authHeader}`);
    console.log(`[WebSocket] Token from auth object: ${!!socket.handshake.auth.token}`);
    console.log(`[WebSocket] Token extracted from header: ${!!token}`);

    if (!token) {
      console.warn(`[WebSocket] Connection attempted without token from ${socket.id}`);
      return next(new Error('Authentication error: No token provided'));
    }

    const secret = process.env.JWT_SECRET || 'secret';
    const decoded = jwt.verify(token, secret) as JWTPayload;

    // Validate decoded payload has required fields from auth service
    if (!decoded.id || !decoded.email) {
      console.warn(`[WebSocket] Invalid token payload for ${socket.id}`);
      return next(new Error('Authentication error: Invalid token payload'));
    }

    // Attach user data to socket (same as REST API)
    socket.userId = decoded.id;
    socket.email = decoded.email;
    socket.subscribedRooms = new Set<string>();
    socket.isAuthenticated = true;

    // Optionally verify user still exists in database (adds DB query overhead)
    // Uncomment if you want to ensure the user account still exists:
    // const user = await authService.validateUser(token);
    // if (!user) {
    //   return next(new Error('Authentication error: User not found'));
    // }

    console.log(`[WebSocket] User ${decoded.id} (${decoded.email}) authenticated from ${socket.id}`);
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.warn(`[WebSocket] Token expired for ${socket.id}`);
      return next(new Error('Authentication error: Token expired'));
    }

    if (error instanceof jwt.JsonWebTokenError) {
      console.warn(`[WebSocket] Invalid token for ${socket.id}: ${error.message}`);
      return next(new Error('Authentication error: Invalid token'));
    }

    console.warn(`[WebSocket] Authentication failed for ${socket.id}: ${(error as Error).message}`);
    next(new Error(`Authentication error: ${(error as Error).message}`));
  }
};

/**
 * Validate room subscription - check if user is authorized
 * Supports device/{deviceId} and home/{homeId} room patterns
 * For now: allows subscription if user is authenticated
 * Future: add database-backed authorization checks
 */
export const validateRoomSubscription = (socket: AuthenticatedSocket, room: string): boolean => {
  if (!room || !socket.isAuthenticated || !socket.userId) {
    return false;
  }

  const [roomType, roomId] = room.split('/');

  // For now, allow authenticated users to subscribe to any room
  // TODO: Add database authorization checks:
  // - Check if user owns the device
  // - Check if user has access to the home
  // - Check user permissions

  if (roomType !== 'device' && roomType !== 'home' && roomType !== 'user') {
    console.warn(`[WebSocket] Unknown room type pattern: ${room} from user ${socket.userId}`);
    return false;
  }

  console.log(`[WebSocket] User ${socket.userId} authorized to subscribe to ${room}`);
  return true;
};

/**
 * Handle client subscribe request with authorization
 */
export const handleSubscribe = (socket: AuthenticatedSocket, room: string) => {
  if (!validateRoomSubscription(socket, room)) {
    socket.emit('error', { message: `Unauthorized to subscribe to ${room}` });
    return;
  }

  socket.join(room);
  socket.subscribedRooms.add(room);
  console.log(`[WebSocket] User ${socket.userId} subscribed to ${room}`);
  socket.emit('subscribed', { room });
};

/**
 * Handle client unsubscribe request
 */
export const handleUnsubscribe = (socket: AuthenticatedSocket, room: string) => {
  socket.leave(room);
  socket.subscribedRooms.delete(room);
  console.log(`[WebSocket] User ${socket.userId} unsubscribed from ${room}`);
  socket.emit('unsubscribed', { room });
};
