// ============================================================
// WebSocket Client — Socket.IO Singleton
// ============================================================
// Configuration:
//   NEXT_PUBLIC_WS_URL   — WebSocket server URL (e.g. http://localhost:8000)
//   NEXT_PUBLIC_USE_MOCK — set to "true" to simulate WebSocket events locally
//
// Events emitted by the server that this client listens to:
//   "energy"  → { metrics: EnergyMetrics }
//   "alert"   → { alert: Alert }
//
// To connect to your real backend:
//   1. Set NEXT_PUBLIC_USE_MOCK=false
//   2. Set NEXT_PUBLIC_WS_URL=http://your-ws-server
//   3. Ensure your backend emits the expected event shapes
// ============================================================

import { io, Socket } from 'socket.io-client';
import type { EnergyMetrics, Alert } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

// ── Event definitions ────────────────────────────────────────

export interface ServerToClientEvents {
    energy: (data: { metrics: EnergyMetrics }) => void;
    alert: (data: { alert: Alert }) => void;
    connected: () => void;
    disconnected: () => void;
}

export interface ClientToServerEvents {
    subscribe: (room: string) => void;
    unsubscribe: (room: string) => void;
}

// ── Singleton instance ───────────────────────────────────────

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
    if (!socket) {
        if (USE_MOCK) {
            // In mock mode: create a disconnected socket so hooks still work,
            // actual data comes from the mock event simulator below
            socket = io(WS_URL, {
                autoConnect: false,
                transports: ['websocket'],
            }) as Socket<ServerToClientEvents, ClientToServerEvents>;
        } else {
            socket = io(WS_URL, {
                transports: ['websocket'],
                reconnectionAttempts: 5,
                reconnectionDelay: 2000,
            }) as Socket<ServerToClientEvents, ClientToServerEvents>;
            socket.connect();
        }
    }
    return socket;
}

export function disconnectSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}

// ── Mock event simulator ──────────────────────────────────────
// Only used when NEXT_PUBLIC_USE_MOCK=true
// Simulates real-time WebSocket events in the browser

type MockEventHandler = {
    energy: Array<(data: { metrics: EnergyMetrics }) => void>;
    alert: Array<(data: { alert: Alert }) => void>;
};

const mockHandlers: MockEventHandler = { energy: [], alert: [] };
let mockIntervalEnergy: ReturnType<typeof setInterval> | null = null;
let mockIntervalAlert: ReturnType<typeof setInterval> | null = null;

export function startMockSimulator() {
    if (typeof window === 'undefined' || !USE_MOCK) return;

    // Lazy import to avoid SSR issues
    Promise.all([
        import('@/lib/mockData'),
    ]).then(([{ generateLiveMetrics, generateRandomAlert }]) => {
        let prev: EnergyMetrics | undefined;

        mockIntervalEnergy = setInterval(() => {
            prev = generateLiveMetrics(prev);
            mockHandlers.energy.forEach((fn) => fn({ metrics: prev! }));
        }, 2000);

        mockIntervalAlert = setInterval(() => {
            if (Math.random() < 0.15) { // 15% chance every 15s
                const alert = generateRandomAlert();
                mockHandlers.alert.forEach((fn) => fn({ alert }));
            }
        }, 15000);
    });
}

export function stopMockSimulator() {
    if (mockIntervalEnergy) clearInterval(mockIntervalEnergy);
    if (mockIntervalAlert) clearInterval(mockIntervalAlert);
}

export function onMockEvent<K extends keyof MockEventHandler>(
    event: K,
    handler: MockEventHandler[K][number]
) {
    (mockHandlers[event] as Array<typeof handler>).push(handler);
}

export function offMockEvent<K extends keyof MockEventHandler>(
    event: K,
    handler: MockEventHandler[K][number]
) {
    (mockHandlers[event] as Array<typeof handler>) = (
        mockHandlers[event] as Array<typeof handler>
    ).filter((h) => h !== handler);
}

export const isMockMode = USE_MOCK;
