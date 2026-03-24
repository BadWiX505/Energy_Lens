'use client';

import { useEffect, useState } from 'react';
import { isMockMode, startMockSimulator, stopMockSimulator } from '@/lib/socket';

/**
 * useSocket — manages global socket lifecycle and connection status.
 */
export function useSocket() {
    const [connected, setConnected] = useState(isMockMode); // mock = always "connected"

    useEffect(() => {
        if (isMockMode) {
            startMockSimulator();
            setConnected(true);
            return () => stopMockSimulator();
        }

        let socket: Awaited<ReturnType<typeof import('@/lib/socket').getSocket>>;

        import('@/lib/socket').then(({ getSocket }) => {
            socket = getSocket();
            setConnected(socket.connected);

            socket.on('connect', () => setConnected(true));
            socket.on('disconnect', () => setConnected(false));
        });

        return () => {
            if (socket) {
                socket.off('connect');
                socket.off('disconnect');
            }
        };
    }, []);

    return { connected };
}
