import { Socket } from 'socket.io';
import { Request } from 'express';

/**
 * JWT decoded payload structure from auth service
 * Matches the JWT structure used in auth.service.ts: { id, email }
 */
export interface JWTPayload {
  id: string;      // User ID from auth service
  email: string;   // User email from auth service
  iat?: number;    // Issued at
  exp?: number;    // Expiration time
}

/**
 * Authenticated Socket interface extending Socket.IO's base Socket
 * Uses the same JWT structure as REST API
 */
export interface AuthenticatedSocket extends Socket {
  userId: string;                   // User ID (from jwt.id)
  email: string;                    // User email
  subscribedRooms: Set<string>;     // Track subscribed rooms
  isAuthenticated: boolean;          // Flag to indicate successful auth
}

/**
 * MQTT device payload structure - matches device/main.js output
 */
export interface MQTTDevicePayload {
  timestamp: string; // ISO string
  tags: {
    device_id: string;
    [key: string]: string; // Allow additional tags
  };
  metrics: {
    voltage: number;
    current: number;
    power_watts: number;
    energy_kwh: number;
    frequency: number;
    [key: string]: number | string; // Allow additional metrics
  };
}

/**
 * Energy metrics event payload - sent to clients
 */
export interface EnergyMetricsPayload {
  deviceId: string;
  timestamp: string;
  tags: {
    device_id: string;
    [key: string]: string;
  };
  metrics: {
    voltage: number;
    current: number;
    power_watts: number;
    energy_kwh: number;
    frequency: number;
    [key: string]: number | string;
  };
}

/**
 * Alert event payload - extensible structure
 */
export interface AlertEventPayload {
  alertId: string;
  deviceId?: string;
  homeId?: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Tip event payload - extensible structure
 */
export interface TipEventPayload {
  tipId: string;
  userId?: string;
  homeId?: string;
  deviceId?: string;
  title: string;
  description: string;
  category: string;
  imageUrls?: string[];
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Score earned event payload - emitted when a goal or achievement awards points
 */
export interface ScoreEarnedPayload {
  homeId: string;
  scoreId: string;
  score: number;
  type: string;
  label?: string | null;
  totalScore: number;
  date: string; // ISO 8601
}

/**
 * WebSocket event names and types for type-safe emissions
 */
export interface ServerToClientEvents {
  'energy:metrics': (payload: EnergyMetricsPayload) => void;
  'alert:received': (payload: AlertEventPayload) => void;
  'tip:received': (payload: TipEventPayload) => void;
  'score:earned': (payload: ScoreEarnedPayload) => void;
  'connected': () => void;
  'disconnected': () => void;
}

/**
 * WebSocket event names from client (optional, for future use)
 */
export interface ClientToServerEvents {
  'subscribe': (room: string) => void;
  'unsubscribe': (room: string) => void;
}

/**
 * Room naming conventions
 */
export enum RoomType {
  DEVICE = 'device',
  HOME = 'home',
  USER = 'user',
}

/**
 * Helper to construct room name
 */
export const getRoomName = (type: RoomType, id: string): string => {
  return `${type}/${id}`;
};

/**
 * Room name patterns
 */
export const ROOM_PATTERNS = {
  device: (deviceId: string) => getRoomName(RoomType.DEVICE, deviceId),
  home: (homeId: string) => getRoomName(RoomType.HOME, homeId),
  user: (userId: string) => getRoomName(RoomType.USER, userId),
};
