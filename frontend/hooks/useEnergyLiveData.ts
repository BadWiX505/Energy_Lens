'use client';

import { useEffect } from 'react';
import { useEnergyStore } from '@/store/energyStore';
import { useSocket } from './useSocket';
import { useSettingsStore } from '@/store/settingsStore';
import type { EnergyMetricsPayload } from '@/types';
import { useAuthStore } from '@/store/authStore';

/**
 * Hook to subscribe to real-time energy metrics for a specific device via WebSocket
 * 
 * Features:
 * - Automatically subscribes to device/{deviceId} room
 * - Listens to energy:metrics events from the server
 * - Updates energyStore with received metrics and history
 * - Handles unsubscription when device changes
 * - Only works in non-mock mode (mock mode uses useEnergy hook with mock simulator)
 * 
 * @param deviceId - The device ID to monitor (e.g., 'energy_meter_001')
 */
export function useEnergyLiveData(deviceId: string | null) {
    const { connected } = useSocket();
    const { setMetrics, pushHistory } = useEnergyStore();
    const { settings } = useSettingsStore();
    const { token } = useAuthStore();

    useEffect(() => {
        if (!deviceId || !connected) {
            return;
        }

        let socket: Awaited<ReturnType<typeof import('@/lib/socket').getSocket>> | null;

        const subscribe = async () => {
            const { getSocket, isMockMode } = await import('@/lib/socket');

            // Only subscribe in real mode (mock mode uses separate simulator)
            if (isMockMode) {
                console.log('[EnergyLiveData] Mock mode - using mock simulator instead');
                return;
            }
        
            socket = getSocket(token || undefined);

            // Handle null socket case
            if (!socket) {
                console.error('[EnergyLiveData] Failed to initialize socket - token may be invalid');
                return;
            }

            // Subscribe to device room
            const room = `device/${deviceId}`;
            socket.emit('subscribe', room);
            console.log(`[EnergyLiveData] Subscribed to ${room}`);

            // Listen for energy:metrics events
            const handleEnergyMetrics = (payload: any) => {
                console.log('[EnergyLiveData] Received energy:metrics:', payload);

                // Convert WebSocket payload to EnergyMetrics format
                const metrics: EnergyMetricsPayload = payload.payload || payload;
                
                if (metrics.metrics) {
                    const energyMetrics = {
                        power: metrics.metrics.power_watts || 0,
                        voltage: metrics.metrics.voltage || 0,
                        current: metrics.metrics.current || 0,
                        energy: metrics.metrics.energy_kwh || 0,
                        cost: (metrics.metrics.energy_kwh || 0) * settings.price_per_kwh,
                        frequency: typeof metrics.metrics.frequency === 'number' ? metrics.metrics.frequency : 50,
                        powerFactor: typeof metrics.metrics.power_factor === 'number' ? metrics.metrics.power_factor : 0.95,
                        timestamp: metrics.timestamp || new Date().toISOString(),
                    };

                    // Update current metrics
                    setMetrics(energyMetrics);

                    // Add to history for live charts
                    const historyPoint = {
                        ...energyMetrics,
                        label: new Date(energyMetrics.timestamp).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                        }),
                    };
                    pushHistory(historyPoint);
                }
            };

            socket.on('energy:metrics', handleEnergyMetrics);

            // Cleanup listener on unmount or device change
            return () => {
                if (!socket) return;
                socket.off('energy:metrics', handleEnergyMetrics);
                socket.emit('unsubscribe', room);
                console.log(`[EnergyLiveData] Unsubscribed from ${room}`);
            };
        };

        let cleanup: (() => void) | undefined;
        subscribe().then((c) => {
            cleanup = c;
        }).catch(console.error);

        return () => {
            if (cleanup) cleanup();
        };
    }, [deviceId, connected, setMetrics, pushHistory, settings.price_per_kwh,token]);
}
