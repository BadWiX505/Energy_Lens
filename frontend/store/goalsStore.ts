import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Goal, Achievement } from '@/types';
import { MOCK_GOALS, MOCK_ACHIEVEMENTS } from '@/lib/mockData';

interface GoalsState {
    goals: Goal[];
    achievements: Achievement[];
    efficiencyScore: number;
    totalXp: number;
}

interface GoalsActions {
    setGoals: (goals: Goal[]) => void;
    addGoal: (goal: Goal) => void;
    removeGoal: (id: string) => void;
    updateGoalProgress: (id: string, current: number) => void;
    setAchievements: (achievements: Achievement[]) => void;
    unlockAchievement: (id: string) => void;
}

export const useGoalsStore = create<GoalsState & GoalsActions>()(
    immer((set) => ({
        goals: MOCK_GOALS,
        achievements: MOCK_ACHIEVEMENTS,
        efficiencyScore: 78,
        totalXp: MOCK_ACHIEVEMENTS.filter((a) => a.unlocked).reduce((s, a) => s + a.xp, 0),

        setGoals: (goals) =>
            set((s) => {
                s.goals = goals;
            }),

        addGoal: (goal) =>
            set((s) => {
                s.goals.push(goal);
            }),

        removeGoal: (id) =>
            set((s) => {
                s.goals = s.goals.filter((g) => g.id !== id);
            }),

        updateGoalProgress: (id, current) =>
            set((s) => {
                const g = s.goals.find((g) => g.id === id);
                if (g) g.current = current;
            }),

        setAchievements: (achievements) =>
            set((s) => {
                s.achievements = achievements;
            }),

        unlockAchievement: (id) =>
            set((s) => {
                const a = s.achievements.find((a) => a.id === id);
                if (a && !a.unlocked) {
                    a.unlocked = true;
                    a.unlockedAt = new Date().toISOString();
                    s.totalXp += a.xp;
                }
            }),
    }))
);
