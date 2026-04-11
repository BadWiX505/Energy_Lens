import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Tip } from '@/types';

interface TipsState {
    tips: Tip[];
}

interface TipsActions {
    setTips: (tips: Tip[]) => void;
    addTip: (tip: Tip) => void;
    removeTip: (id: string) => void;
    clearTips: () => void;
}

export const useTipsStore = create<TipsState & TipsActions>()(
    immer((set) => ({
        tips: [],

        setTips: (tips) =>
            set((s) => {
                s.tips = tips;
            }),

        addTip: (tip) =>
            set((s) => {
                // Prevent duplicates by tipId
                if (!s.tips.some(t => t.id === tip.id)) {
                    s.tips.unshift(tip); // Prepend to show newest first
                }
            }),

        removeTip: (id) =>
            set((s) => {
                s.tips = s.tips.filter((t) => t.id !== id);
            }),

        clearTips: () =>
            set((s) => {
                s.tips = [];
            }),
    }))
);
