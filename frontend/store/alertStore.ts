import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Alert } from '@/types';

interface AlertState {
    alerts: Alert[];
    unreadCount: number;
}

interface AlertActions {
    setAlerts: (alerts: Alert[]) => void;
    addAlert: (alert: Alert) => void;
    markRead: (id: string) => void;
    markAllRead: () => void;
    clearAlerts: () => void;
}

export const useAlertStore = create<AlertState & AlertActions>()(
    immer((set) => ({
        alerts: [],
        unreadCount: 0,

        setAlerts: (alerts) =>
            set((s) => {
                s.alerts = alerts;
                s.unreadCount = alerts.filter((a) => !a.read).length;
            }),

        addAlert: (alert) =>
            set((s) => {
                s.alerts.unshift(alert);
                if (!alert.read) s.unreadCount += 1;
            }),

        markRead: (id) =>
            set((s) => {
                const a = s.alerts.find((x) => x.id === id);
                if (a && !a.read) {
                    a.read = true;
                    s.unreadCount = Math.max(0, s.unreadCount - 1);
                }
            }),

        markAllRead: () =>
            set((s) => {
                s.alerts.forEach((a) => (a.read = true));
                s.unreadCount = 0;
            }),

        clearAlerts: () =>
            set((s) => {
                s.alerts = [];
                s.unreadCount = 0;
            }),
    }))
);
