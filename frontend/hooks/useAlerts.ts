'use client';

import { useEffect } from 'react';
// import React from 'react';
// import toast from 'react-hot-toast';
import { isMockMode, onMockEvent, offMockEvent } from '@/lib/socket';
import { useAlertStore } from '@/store/alertStore';
import { useAuthStore } from '@/store/authStore';
import { useAlertSound } from './useAlertSound';
import type { Alert } from '@/types';
// import { AlertToast } from '@/components/ui/AlertToast';

/**
 * useAlerts — subscribes to real-time alert events globally.
 * Shows toast notifications with audio for incoming alerts.
 * 
 * Features:
 * - Severity-based audio alerts (critical, warning, info)
 * - Custom AlertToast component for modern notification UI
 * - Auto-dismiss after 5 seconds
 * - Clickable to navigate to alerts page
 */
export function useAlerts() {
    const { alerts, unreadCount, addAlert, markRead, markAllRead, setAlerts } = useAlertStore();
    const { token } = useAuthStore();
    const { playSound } = useAlertSound();

    useEffect(() => {
        const handler = (data: { alert: Alert }) => {
            addAlert(data.alert);

            // Play sound based on severity
            playSound(data.alert.severity).catch(err => 
              console.warn('[useAlerts] Failed to play sound:', err)
            );

            // // Show toast with custom AlertToast component (without JSX in .ts file)
            // toast.custom((t) => React.createElement(AlertToast, {
            //   severity: data.alert.severity,
            //   title: data.alert.title,
            //   description: data.alert.message,
            //   onClose: () => toast.dismiss(t.id),
            //   onClick: () => {
            //     toast.dismiss(t.id);
            //     window.location.href = '/alerts';
            //   },
            // }), {
            //   duration: 5000,
            //   position: 'top-right',
            //   style: {
            //     background: 'transparent',
            //     border: 'none',
            //     padding: 0,
            //     boxShadow: 'none',
            //   },
            // });
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
    }, [addAlert, token, playSound]);

    return { alerts, unreadCount, markRead, markAllRead, setAlerts };
}
