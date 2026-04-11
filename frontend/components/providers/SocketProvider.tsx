'use client';

import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAlerts } from '@/hooks/useAlerts';
import { useAlertsLiveData } from '@/hooks/useAlertsLiveData';
import { useTips } from '@/hooks/useTips';
import { useTipsLiveData } from '@/hooks/useTipsLiveData';
import { useAlertStore } from '@/store/alertStore';
import { useTipsStore } from '@/store/tipsStore';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getAlerts, getTips } from '@/lib/api';
import { Toaster } from 'react-hot-toast';

/**
 * SocketProvider — global provider that:
 *   1. Boots the WebSocket connection with JWT authentication (real or mock)
 *   2. Subscribes to real-time alerts + tips events
 *   3. Loads initial alerts and tips from REST API
 *   4. Provides global Toaster for notifications
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { connected } = useSocket();
    const { setAlerts } = useAlertStore();
    const { setTips } = useTipsStore();
    const { token } = useAuthStore();
    const { selectedHomeId } = useSettingsStore();

    // Subscribe globally to real-time alerts and tips (mock mode: 'alert'/'tip' events; real mode: 'alert:received'/'tip:received' events)
    useAlerts();
    useAlertsLiveData(selectedHomeId);
    useTips();
    useTipsLiveData(selectedHomeId);

    // Load initial alerts from REST API on mount or when home changes
    useEffect(() => {
        if (selectedHomeId) {
            getAlerts(selectedHomeId).then(setAlerts).catch(console.error);
        }
    }, [setAlerts, selectedHomeId]);

    // Load initial tips from REST API on mount or when home changes
    useEffect(() => {
        if (selectedHomeId) {
            getTips(selectedHomeId).then(setTips).catch(console.error);
        }
    }, [setTips, selectedHomeId]);

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
