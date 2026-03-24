import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import type { UserSettings, Home } from '@/types';
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
                }),
        })),
        { name: 'energy-lens-settings' }
    )
);
