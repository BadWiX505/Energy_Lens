import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Goal, Achievement, EnergyScore, CommunityStats } from '@/types';

interface GoalsState {
    goals: Goal[];
    achievements: Achievement[];
    totalScore: number;
    energyScores: EnergyScore[];
    communityStats: CommunityStats | null;
    newScores: EnergyScore[];
    newAchievements: Achievement[];
}

interface GoalsActions {
    setGoals: (goals: Goal[]) => void;
    addGoal: (goal: Goal) => void;
    removeGoal: (id: string) => void;
    setAchievements: (achievements: Achievement[]) => void;
    setTotalScore: (score: number) => void;
    setEnergyScores: (scores: EnergyScore[]) => void;
    setCommunityStats: (stats: CommunityStats) => void;
    setNewScores: (scores: EnergyScore[]) => void;
    setNewAchievements: (achievements: Achievement[]) => void;
    dismissCelebration: () => void;
}

export const useGoalsStore = create<GoalsState & GoalsActions>()(
    immer((set) => ({
        goals: [],
        achievements: [],
        totalScore: 0,
        energyScores: [],
        communityStats: null,
        newScores: [],
        newAchievements: [],

        setGoals: (goals) => set((s) => { s.goals = goals; }),
        addGoal: (goal) => set((s) => { s.goals.push(goal); }),
        removeGoal: (id) => set((s) => { s.goals = s.goals.filter((g) => g.id !== id); }),
        setAchievements: (achievements) => set((s) => { s.achievements = achievements; }),
        setTotalScore: (score) => set((s) => { s.totalScore = score; }),
        setEnergyScores: (scores) => set((s) => { s.energyScores = scores; }),
        setCommunityStats: (stats) => set((s) => { s.communityStats = stats; }),
        setNewScores: (scores) => set((s) => { s.newScores = scores; }),
        setNewAchievements: (achievements) => set((s) => { s.newAchievements = achievements; }),
        dismissCelebration: () => set((s) => {
            s.newScores = [];
            s.newAchievements = [];
        }),
    }))
);

