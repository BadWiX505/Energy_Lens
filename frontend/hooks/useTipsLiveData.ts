'use client';

import { useEffect } from 'react';
import { useTipsStore } from '@/store/tipsStore';
import { useSocket } from './useSocket';
import { useAuthStore } from '@/store/authStore';
import type { Tip } from '@/types';
import React from 'react';
import toast from 'react-hot-toast';
import { TipToast } from '@/components/ui/TipToast';
import { useAlertSound } from './useAlertSound';

/**
 * Hook to subscribe to real-time tips for a specific home via WebSocket
 *
 * Features:
 * - Automatically subscribes to home/{homeId} room
 * - Listens to tip:received events from the server
 * - Updates tipsStore with received tips
 * - Shows toast notification for new tips
 */
export function useTipsLiveData(homeId: string | null) {
    const { connected } = useSocket();
    const { addTip } = useTipsStore();
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
                console.log('[TipsLiveData] Mock mode - not connecting to live tips');
                return;
            }

            socket = getSocket(token || undefined);
            if (!socket) return;

            // Subscribe to home room to catch tips for this home
            const room = `home/${homeId}`;
            socket.emit('subscribe', room);
            console.log(`[TipsLiveData] Subscribed to ${room}`);

            const handleTip = (payload: any) => {
                console.log('[TipsLiveData] Received tip:', payload);
                const event = payload.payload || payload;
                if (!event) return;

                // Map websocket payload to Tip interface
                const newTip: Tip = {
                    id: event.tipId || Math.random().toString(36).slice(2),
                    homeId: event.homeId || homeId,
                    iconName: event.iconName || 'Lightbulb',
                    title: event.title || 'Energy Tip',
                    description: event.description || '',
                    categoryTag: event.category || 'General',
                    estimatedSavings: event.metadata?.estimatedSavings || '~3% savings',
                    createdAt: event.timestamp || new Date().toISOString(),
                    generatedAt: event.timestamp || new Date().toISOString(),
                };

                // Add tip to store (store handles deduping)
                addTip(newTip);

                // Play notification sound
                playSound('info').catch((err) =>
                    console.warn('[TipsLiveData] Failed to play tip sound:', err)
                );

                // Show toast notification using React.createElement (no JSX in .ts files)
                toast.custom(
                    (t) =>
                        React.createElement(TipToast, {
                            title: newTip.title,
                            description: newTip.description,
                            onClose: () => toast.dismiss(t.id),
                            onClick: () => toast.dismiss(t.id),
                        }),
                    {
                        duration: 6000,
                        position: 'bottom-right',
                        style: {
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            boxShadow: 'none',
                        },
                    }
                );
            };

            socket.on('tip:received', handleTip);

            return () => {
                if (!socket) return;
                socket.off('tip:received', handleTip);
                socket.emit('unsubscribe', room);
                console.log(`[TipsLiveData] Unsubscribed from ${room}`);
            };
        };

        let cleanup: (() => void) | undefined;
        subscribe()
            .then((c) => {
                cleanup = c;
            })
            .catch(console.error);

        return () => {
            if (cleanup) cleanup();
        };
    }, [homeId, connected, addTip, token, playSound]);
}
