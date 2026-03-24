'use client';

import { useEffect, useRef, useState } from 'react';
import { isMockMode, onMockEvent, offMockEvent } from '@/lib/socket';
import { useEnergyStore } from '@/store/energyStore';
import type { EnergyMetrics, EnergyHistoryPoint } from '@/types';

/**
 * useEnergy — subscribes to real-time energy events.
 * Works with both mock simulator and real Socket.IO server.
 */
export function useEnergy() {
    const { metrics, history, setMetrics, pushHistory } = useEnergyStore();

    useEffect(() => {
        if (!isMockMode) {
            // Real socket: import lazily to avoid SSR issues
            import('@/lib/socket').then(({ getSocket }) => {
                const socket = getSocket();
                const handler = (data: { metrics: EnergyMetrics }) => {
                    setMetrics(data.metrics);
                    const point: EnergyHistoryPoint = {
                        ...data.metrics,
                        label: new Date(data.metrics.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                        }),
                    };
                    pushHistory(point);
                };
                socket.on('energy', handler);
                return () => { socket.off('energy', handler); };
            });
        } else {
            // Mock socket
            const handler = (data: { metrics: EnergyMetrics }) => {
                setMetrics(data.metrics);
                const point: EnergyHistoryPoint = {
                    ...data.metrics,
                    label: new Date(data.metrics.timestamp).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                    }),
                };
                pushHistory(point);
            };
            onMockEvent('energy', handler);
            return () => offMockEvent('energy', handler);
        }
    }, [setMetrics, pushHistory]);

    return { metrics, history };
}
