import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { EnergyMetrics, EnergyHistoryPoint, MonitoringMode } from '@/types';

const MAX_HISTORY_BUFFER = 60; // keep last 60 points for live charts

interface EnergyState {
    metrics: EnergyMetrics | null;
    history: EnergyHistoryPoint[];
    groupedHistory: EnergyHistoryPoint[];
    monitoringMode: MonitoringMode;
    isLoading: boolean;
}

interface EnergyActions {
    setMetrics: (metrics: EnergyMetrics) => void;
    pushHistory: (point: EnergyHistoryPoint) => void;
    setGroupedHistory: (data: EnergyHistoryPoint[]) => void;
    setMonitoringMode: (mode: MonitoringMode) => void;
    setLoading: (v: boolean) => void;
    reset: () => void;
}

const initialState: EnergyState = {
    metrics: null,
    history: [],
    groupedHistory: [],
    monitoringMode: 'live',
    isLoading: false,
};

export const useEnergyStore = create<EnergyState & EnergyActions>()(
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

        reset: () => set(() => initialState),
    }))
);
