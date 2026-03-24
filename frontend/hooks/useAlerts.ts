'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { isMockMode, onMockEvent, offMockEvent } from '@/lib/socket';
import { useAlertStore } from '@/store/alertStore';
import type { Alert } from '@/types';
import { severityColors } from '@/lib/utils';

/**
 * useAlerts — subscribes to real-time alert events globally.
 * Shows toast notifications for incoming alerts.
 */
export function useAlerts() {
    const { alerts, unreadCount, addAlert, markRead, markAllRead, setAlerts } = useAlertStore();

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
            import('@/lib/socket').then(({ getSocket }) => {
                const socket = getSocket();
                socket.on('alert', handler);
            });
            return () => {
                import('@/lib/socket').then(({ getSocket }) => {
                    const socket = getSocket();
                    socket.off('alert', handler);
                });
            };
        } else {
            onMockEvent('alert', handler);
            return () => offMockEvent('alert', handler);
        }
    }, [addAlert]);

    return { alerts, unreadCount, markRead, markAllRead, setAlerts };
}
