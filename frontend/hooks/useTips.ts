'use client';

import { useEffect } from 'react';
import { isMockMode, onMockEvent, offMockEvent } from '@/lib/socket';
import { useTipsStore } from '@/store/tipsStore';
import { useAuthStore } from '@/store/authStore';
import type { Tip } from '@/types';

/**
 * useTips — subscribes to real-time tip events globally.
 * Handles both mock mode and real socket connections.
 * 
 * Features:
 * - Listens for incoming tips (mock: 'tip', real: global, deduped via store)
 * - Adds tips to store (with deduping)
 * - Returns tips state for UI
 */
export function useTips() {
    const { tips, addTip, setTips } = useTipsStore();
    const { token } = useAuthStore();

    useEffect(() => {
        const handler = (data: { tip: Tip }) => {
            if (data.tip) {
                addTip(data.tip);
            }
        };

        if (!isMockMode) {
            // Real socket mode: only subscribe if token is available
            if (!token) return;

            import('@/lib/socket').then(({ getSocket }) => {
                const socket = getSocket(token);
                if (!socket) return;
                socket.on('tip', handler);
            });

            return () => {
                import('@/lib/socket').then(({ getSocket }) => {
                    const socket = getSocket(token);
                    if (!socket) return;
                    socket.off('tip', handler);
                });
            };
        } else {
            // Mock mode: use local event emitter
            onMockEvent('tip', handler);
            return () => offMockEvent('tip', handler);
        }
    }, [addTip, token]);

    return { tips, setTips };
}
