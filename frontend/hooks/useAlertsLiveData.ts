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
/**
 * Hook to subscribe to real-time alerts for a specific home via WebSocket
 * 
 * Features:
 * - Automatically subscribes to home/{homeId} room
 * - Listens to alert:received events from the server
 * - Updates alertStore with received alerts
 * - Plays severity-based audio notifications
 */
export function useAlertsLiveData(homeId: string | null) {
    const { connected } = useSocket();
    const { addAlert } = useAlertStore();
    const { token } = useAuthStore();
    const { playSound } = useAlertSound();

    useEffect(() => {
        if (!homeId || !connected) {
            return;
        }

        let socket: Awaited<ReturnType<typeof import('@/lib/socket').getSocket>> | null;

        const subscribe = async () => {
            const { getSocket, isMockMode } = await import('@/lib/socket');

            if (isMockMode) {
                console.log('[AlertsLiveData] Mock mode - not connecting to live alerts');
                return;
            }

            socket = getSocket(token || undefined);

            if (!socket) return;

            // Subscribe to home room to catch alerts targeting this home
            const room = `home/${homeId}`;
            socket.emit('subscribe', room);
            console.log(`[AlertsLiveData] Subscribed to ${room}`);

            const handleAlert = (payload: any) => {
                console.log('[AlertsLiveData] Received alert:', payload);
                const event = payload.payload || payload;
                if (!event) return;

                // Normalize severity (backend uses 'warnings' plural, frontend uses 'warning' singular)
                const normalizedSeverity = event.severity;
                // Map to frontend Alert interface
                const newAlert: Alert = {
                    id: event.alertId || Math.random().toString(36).slice(2),
                    type: 'system',
                    severity: normalizedSeverity,
                    title: event.title || normalizedSeverity.toUpperCase() + ' Alert',
                    message: event.description || '',
                    timestamp: event.timestamp || new Date().toISOString(),
                    read: false,
                };

                // Add alert to store (which triggers toast display)
                addAlert(newAlert);

                // Play sound based on severity
                playSound(normalizedSeverity).catch(err =>
                    console.warn('[AlertsLiveData] Failed to play alert sound:', err)
                );
                toast.custom((t) => React.createElement(AlertToast, {
                    severity: event.severity,
                    title: event.title || normalizedSeverity.toUpperCase() + ' Alert',
                    description: event.description || '',
                    onClose: () => toast.dismiss(t.id),
                    onClick: () => {
                        toast.dismiss(t.id);
                        window.location.href = '/alerts';
                    },
                }), {
                    duration: 5000,
                    position: 'top-right',
                    style: {
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        boxShadow: 'none',
                    },
                });
            };

            socket.on('alert:received', handleAlert);

            return () => {
                if (!socket) return;
                socket.off('alert:received', handleAlert);
                socket.emit('unsubscribe', room);
                console.log(`[AlertsLiveData] Unsubscribed from ${room}`);
            };
        };

        let cleanup: (() => void) | undefined;
        subscribe().then((c) => {
            cleanup = c;
        }).catch(console.error);

        return () => {
            if (cleanup) cleanup();
        };
    }, [homeId, connected, addAlert, token, playSound]);
}
