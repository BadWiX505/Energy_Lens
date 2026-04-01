'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAlerts } from '@/hooks/useAlerts';
import { useAlertStore } from '@/store/alertStore';
import { useAuthStore } from '@/store/authStore';
import { getAlerts } from '@/lib/api';
import { Toaster } from 'react-hot-toast';

/**
 * SocketProvider — global provider that:
 *   1. Boots the WebSocket connection with JWT authentication (real or mock)
 *   2. Subscribes to real-time energy + alert events
 *   3. Loads initial alerts from REST API
 *   4. Provides global Toaster for notifications
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { connected } = useSocket();
    const { setAlerts } = useAlertStore();
    const { token } = useAuthStore();

    // Subscribe globally to real-time alerts (also shows toasts)
    useAlerts();

    // Load initial alerts from REST API on mount
    useEffect(() => {
        getAlerts().then(setAlerts).catch(console.error);
    }, [setAlerts]);

    // Initialize socket connection with JWT token on mount
    useEffect(() => {
        if (token) {
            // getSocket from lib/socket.ts will use the token for authentication
            import('@/lib/socket').then(({ getSocket }) => {
                getSocket(token);
            });
        }
    }, [token]);

    return (
        <>
            {children}
            <Toaster
                position="top-right"
                toastOptions={{
                    className: 'dark:bg-zinc-800 dark:text-white text-sm',
                    style: { borderRadius: '10px' },
                    duration: 4000,
                }}
            />
        </>
    );
}
