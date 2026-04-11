import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
}

interface AuthActions {
    setAuth: (user: User, token: string) => void;
    updateUser: (user: User) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
            updateUser: (user) => set({ user }),
            logout: () => {},
        }),
        { name: 'energy-lens-auth' }
    )
);
