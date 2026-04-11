import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { UserSettings, Home, Device } from '@/types';
import { DEFAULT_SETTINGS } from '@/lib/mockData';

interface SettingsState {
    settings: UserSettings;
    homes: Home[];
    selectedHomeId: string;
    isHomesLoaded: boolean;
}

interface SettingsActions {
    updateSettings: (partial: Partial<UserSettings>) => void;
    setHomes: (homes: Home[]) => void;
    setHomesLoaded: (isLoaded: boolean) => void;
    selectHome: (id: string) => void;
    addHome: (home: Home) => void;
    updateHome: (id: string, patch: Partial<Omit<Home, 'id'>>) => void;
    removeHome: (id: string) => void;
    addDevice: (homeId: string, device: Device) => void;
    updateDeviceInHome: (homeId: string, deviceId: string, patch: Partial<Device>) => void;
    setDevicesForHome: (homeId: string, devices: Device[]) => void;
    removeDevice: (homeId: string, deviceId: string) => void;
}

export const useSettingsStore = create<SettingsState & SettingsActions>()(
    persist(
        immer((set) => ({
            settings: DEFAULT_SETTINGS,
            homes: [],
            selectedHomeId: '',
            isHomesLoaded: false,

            updateSettings: (partial) =>
                set((s) => {
                    Object.assign(s.settings, partial);
                }),

            setHomes: (homes) =>
                set((s) => {
                    // API never returns nested devices; preserve per-home lists so a later
                    // setHomes (re-fetch, persist rehydrate timing, etc.) does not wipe them.
                    s.homes = homes.map((h) => {
                        const prev = s.homes.find((p) => p.id === h.id);
                        return { ...h, devices: prev?.devices };
                    });
                    if (!s.selectedHomeId || !homes.some((h) => h.id === s.selectedHomeId)) {
                        s.selectedHomeId = homes.length > 0 ? homes[0].id : '';
                    }
                }),

            setHomesLoaded: (isLoaded) =>
                set((s) => {
                    s.isHomesLoaded = isLoaded;
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

            updateHome: (id, patch) =>
                set((s) => {
                    const home = s.homes.find((h) => h.id === id);
                    if (home) Object.assign(home, patch);
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

            updateDeviceInHome: (homeId, deviceId, patch) =>
                set((s) => {
                    const home = s.homes.find((h) => h.id === homeId);
                    const d = home?.devices?.find((x) => x.id === deviceId);
                    if (d) Object.assign(d, patch);
                }),

            setDevicesForHome: (homeId, devices) =>
                set((s) => {
                    const home = s.homes.find((h) => h.id === homeId);
                    if (home) home.devices = devices;
                }),

            removeDevice: (homeId, deviceId) =>
                set((s) => {
                    const home = s.homes.find((h) => h.id === homeId);
                    if (home && home.devices) {
                        home.devices = home.devices.filter((d) => d.id !== deviceId);
                    }
                }),
        })),
        {
            name: 'energy-lens-settings',
            partialize: (state) => ({
                settings: state.settings,
                selectedHomeId: state.selectedHomeId,
            }),
            // Older persisted snapshots included `homes`; ignore them on hydrate so they
            // cannot overwrite homes (and nested devices) loaded from the API.
            merge: (persistedState, currentState) => {
                if (!persistedState || typeof persistedState !== 'object') {
                    return currentState;
                }
                const p = persistedState as Partial<SettingsState & SettingsActions>;
                return {
                    ...currentState,
                    ...p,
                    homes: currentState.homes,
                    isHomesLoaded: currentState.isHomesLoaded,
                };
            },
        }
    )
);
