'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { isMockMode, onMockEvent, offMockEvent } from '@/lib/socket';
import { useAlertStore } from '@/store/alertStore';
import { useAuthStore } from '@/store/authStore';
import type { Alert } from '@/types';
import { severityColors } from '@/lib/utils';

/**
 * useAlerts — subscribes to real-time alert events globally.
 * Shows toast notifications for incoming alerts.
 */
export function useAlerts() {
    const { alerts, unreadCount, addAlert, markRead, markAllRead, setAlerts } = useAlertStore();
    const { token } = useAuthStore();

    useEffect(() => {
        const handler = (data: { alert: Alert }) => {
            addAlert(data.alert);
            // Show toast
            const colors = severityColors[data.alert.severity];
            toast(data.alert.title, {
                icon: data.alert.severity === 'critical' ? '🚨' : data.alert.severity === 'warning' ? '⚠️' : 'ℹ️',
                duration: 5000,
            });
        };

        if (!isMockMode) {
            // Only subscribe if token is available
            if (!token) return;
            
            import('@/lib/socket').then(({ getSocket }) => {
                const socket = getSocket(token);
                if (!socket) return; // Handle null case
                socket.on('alert', handler);
            });
            return () => {
                import('@/lib/socket').then(({ getSocket }) => {
                    const socket = getSocket(token);
                    if (!socket) return; // Handle null case
                    socket.off('alert', handler);
                });
            };
        } else {
            onMockEvent('alert', handler);
            return () => offMockEvent('alert', handler);
        }
    }, [addAlert, token]);

    return { alerts, unreadCount, markRead, markAllRead, setAlerts };
}
