'use client';

import { useEffect } from 'react';
import { useAlertStore } from '@/store/alertStore';
import { useSocket } from './useSocket';
import { useAuthStore } from '@/store/authStore';
import { useAlertSound } from './useAlertSound';
import type { Alert } from '@/types';
import React from 'react';
import toast from 'react-hot-toast';
import { AlertToast } from '@/components/ui/AlertToast';
import { getSocket, isMockMode } from '@/lib/socket';

/**
 * Hook to subscribe to real-time alerts for a specific home via WebSocket.
 * Uses static import + synchronous cleanup to prevent orphaned listeners
 * (which would cause duplicate toasts when the effect re-runs).
 */
export function useAlertsLiveData(homeId: string | null) {
    const { connected } = useSocket();
    const { addAlert } = useAlertStore();
    const { token } = useAuthStore();
    const { playSound } = useAlertSound();

    useEffect(() => {
        if (!homeId || !connected || isMockMode) {
            return;
        }

        const socket = getSocket(token || undefined);
        if (!socket) return;

        const room = `home/${homeId}`;
        socket.emit('subscribe', room);

        const handleAlert = (payload: any) => {
            const event = payload.payload || payload;
            if (!event) return;

            const normalizedSeverity = event.severity;
            const newAlert: Alert = {
                id: event.alertId || Math.random().toString(36).slice(2),
                type: 'system',
                severity: normalizedSeverity,
                title: event.title || normalizedSeverity.toUpperCase() + ' Alert',
                message: event.description || '',
                timestamp: event.timestamp || new Date().toISOString(),
                read: false,
            };

            addAlert(newAlert);

            playSound(normalizedSeverity).catch((err) =>
                console.warn('[AlertsLiveData] Failed to play alert sound:', err)
            );

            toast.custom(
                (t) =>
                    React.createElement(AlertToast, {
                        severity: event.severity,
                        title: event.title || normalizedSeverity.toUpperCase() + ' Alert',
                        description: event.description || '',
                        onClose: () => toast.dismiss(t.id),
                        onClick: () => {
                            toast.dismiss(t.id);
                            window.location.href = '/alerts';
                        },
                    }),
                {
                    duration: 5000,
                    position: 'top-right',
                    style: { background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' },
                }
            );
        };

        socket.on('alert:received', handleAlert);

        return () => {
            socket.off('alert:received', handleAlert);
            socket.emit('unsubscribe', room);
        };
    }, [homeId, connected, addAlert, token, playSound]);
}
