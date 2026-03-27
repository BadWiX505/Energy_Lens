import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { UserSettings, Home, Device } from '@/types';
import { DEFAULT_SETTINGS, MOCK_HOMES } from '@/lib/mockData';

interface SettingsState {
    settings: UserSettings;
    homes: Home[];
    selectedHomeId: string;
}

interface SettingsActions {
    updateSettings: (partial: Partial<UserSettings>) => void;
    setHomes: (homes: Home[]) => void;
    selectHome: (id: string) => void;
    addHome: (home: Home) => void;
    removeHome: (id: string) => void;
    addDevice: (homeId: string, device: Device) => void;
    removeDevice: (homeId: string, deviceId: string) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
    persist(
        immer((set) => ({
            settings: DEFAULT_SETTINGS,
            homes: MOCK_HOMES,
            selectedHomeId: MOCK_HOMES[0].id,

            updateSettings: (partial) =>
                set((s) => {
                    Object.assign(s.settings, partial);
                }),

            setHomes: (homes) =>
                set((s) => {
                    s.homes = homes;
                }),

            selectHome: (id) =>
                set((s) => {
                    s.selectedHomeId = id;
                }),

            addHome: (home) =>
                set((s) => {
                    s.homes.push(home);
                    if (!s.selectedHomeId) {
                        s.selectedHomeId = home.id;
                    }
                }),

            removeHome: (id) =>
                set((s) => {
                    s.homes = s.homes.filter((h) => h.id !== id);
                    if (s.selectedHomeId === id) {
                        s.selectedHomeId = s.homes.length > 0 ? s.homes[0].id : '';
                    }
                }),

            addDevice: (homeId, device) =>
                set((s) => {
                    const home = s.homes.find((h) => h.id === homeId);
                    if (home) {
                        if (!home.devices) home.devices = [];
                        home.devices.push(device);
                    }
                }),

            removeDevice: (homeId, deviceId) =>
                set((s) => {
                    const home = s.homes.find((h) => h.id === homeId);
                    if (home && home.devices) {
                        home.devices = home.devices.filter((d) => d.id !== deviceId);
                    }
                }),
        })),
        { name: 'energy-lens-settings' }
    )
);
