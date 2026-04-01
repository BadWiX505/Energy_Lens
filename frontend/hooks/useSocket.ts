'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { isMockMode, startMockSimulator, stopMockSimulator } from '@/lib/socket';

/**
 * useSocket — manages global socket lifecycle and connection status.
 * Passes JWT token from authStore to the WebSocket connection.
 */
export function useSocket() {
    const [connected, setConnected] = useState(isMockMode); // mock = always "connected"
    const { token } = useAuthStore();

    useEffect(() => {
        if (isMockMode) {
            startMockSimulator();
            setConnected(true);
            return () => stopMockSimulator();
        }

        // Don't initialize socket if no token available
        if (!token) {
            console.log('[Socket] No token available - socket will not connect');
            setConnected(false);
            return;
        }

        let socket: Awaited<ReturnType<typeof import('@/lib/socket').getSocket>>;

        import('@/lib/socket').then(({ getSocket }) => {
            socket = getSocket(token);
            
            // If socket is null, token validation failed
            if (!socket) {
                console.error('[Socket] Failed to initialize - invalid token');
                setConnected(false);
                return;
            }
            
            setConnected(socket.connected);

            socket.on('connect', () => {
                console.log('[Socket] Connected to WebSocket server');
                setConnected(true);
            });
            socket.on('disconnect', () => {
                console.log('[Socket] Disconnected from WebSocket server');
                setConnected(false);
            });
        });

        return () => {
            if (socket) {
                socket.off('connect');
                socket.off('disconnect');
            }
        };
    }, [token]);

    return { connected };
}
