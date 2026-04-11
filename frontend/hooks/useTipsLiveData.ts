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
import { getSocket, isMockMode } from '@/lib/socket';

/**
 * Hook to subscribe to real-time tips for a specific home via WebSocket.
 * Uses static import + synchronous cleanup to avoid orphaned listeners
 * when the effect re-runs due to dependency changes.
 */
export function useTipsLiveData(homeId: string | null) {
    const { connected } = useSocket();
    const { addTip } = useTipsStore();
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

        const handleTip = (payload: any) => {
            const event = payload.payload || payload;
            if (!event) return;

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

            // Only show toast if this tip is NOT already in the store
            // (tips loaded from REST API on mount should not produce toasts)
            const alreadyKnown = useTipsStore.getState().tips.some((t) => t.id === newTip.id);

            addTip(newTip);

            if (!alreadyKnown) {
                playSound('info').catch((err) =>
                    console.warn('[TipsLiveData] Failed to play tip sound:', err)
                );
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
                        style: { background: 'transparent', border: 'none', padding: 0, boxShadow: 'none' },
                    }
                );
            }
        };

        socket.on('tip:received', handleTip);

        return () => {
            socket.off('tip:received', handleTip);
            socket.emit('unsubscribe', room);
        };
    }, [homeId, connected, addTip, token, playSound]);
}
