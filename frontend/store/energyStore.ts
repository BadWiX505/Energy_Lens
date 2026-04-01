import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { EnergyMetrics, EnergyHistoryPoint, MonitoringMode } from '@/types';

const MAX_HISTORY_BUFFER = 60; // keep last 60 points for live charts

interface EnergyState {
    metrics: EnergyMetrics | null;
    history: EnergyHistoryPoint[];
    groupedHistory: EnergyHistoryPoint[];
    monitoringMode: MonitoringMode;
    isLoading: boolean;
    selectedDeviceId: string | null;
}

interface EnergyActions {
    setMetrics: (metrics: EnergyMetrics) => void;
    pushHistory: (point: EnergyHistoryPoint) => void;
    setGroupedHistory: (data: EnergyHistoryPoint[]) => void;
    setMonitoringMode: (mode: MonitoringMode) => void;
    setLoading: (v: boolean) => void;
    setSelectedDevice: (deviceId: string | null) => void;
    reset: () => void;
}

const initialState: EnergyState = {
    metrics: null,
    history: [],
    groupedHistory: [],
    monitoringMode: 'live',
    isLoading: false,
    selectedDeviceId: null,
};

export const useEnergyStore = create<EnergyState & EnergyActions>()(
    persist(
        immer((set) => ({
            ...initialState,

            setMetrics: (metrics) =>
                set((s) => {
                    s.metrics = metrics;
                }),

            pushHistory: (point) =>
                set((s) => {
                    s.history.push(point);
                    if (s.history.length > MAX_HISTORY_BUFFER) {
                        s.history.shift();
                    }
                }),

            setGroupedHistory: (data) =>
                set((s) => {
                    s.groupedHistory = data;
                }),

            setMonitoringMode: (mode) =>
                set((s) => {
                    s.monitoringMode = mode;
                    if (mode === 'live') s.history = [];
                }),

            setLoading: (v) =>
                set((s) => {
                    s.isLoading = v;
                }),

            setSelectedDevice: (deviceId) =>
                set((s) => {
                    s.selectedDeviceId = deviceId;
                    // Clear live history when switching devices
                    s.history = [];
                    s.metrics = null;
                }),

            reset: () => set(() => initialState),
        })),
        {
            name: 'energy-lens-energy',
            partialize: (state) => ({
                selectedDeviceId: state.selectedDeviceId,
                monitoringMode: state.monitoringMode,
            }),
        }
    )
);
