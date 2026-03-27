// ============================================================
// Centralized API Layer
// ============================================================
// Configuration:
//   NEXT_PUBLIC_API_URL  — base URL of your REST API (e.g. http://localhost:8000)
//   NEXT_PUBLIC_USE_MOCK — set to "true" to use mock data instead of real API
//
// To connect to your real backend:
//   1. Set NEXT_PUBLIC_USE_MOCK=false in .env.local
//   2. Set NEXT_PUBLIC_API_URL=http://your-backend-url
//   3. Adjust endpoint paths in each function below if needed
// ============================================================

import type { EnergyMetrics, EnergyHistoryPoint, Alert, Appliance, Goal, UserSettings, User } from '@/types';
import type { MonitoringMode } from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
    generateLiveMetrics,
    generateHourlyHistory,
    generateDailyHistory,
    generateWeeklyHistory,
    generateMonthlyHistory,
    MOCK_ALERTS,
    MOCK_APPLIANCES,
    MOCK_GOALS,
    DEFAULT_SETTINGS,
} from '@/lib/mockData';

const API_BASE = 'http://localhost:3001';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

// ── Internal fetch wrapper ───────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Note: useAuthStore.getState() might only work properly on the client side.
    if (typeof window !== 'undefined') {
        const token = useAuthStore.getState().token;
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }

    const response = await fetch(`${API_BASE}${path}`, {
        headers: {
            ...headers,
            ...options?.headers,
        },
        ...options,
    });

    if (!response.ok) {
        let errMessage = `API error ${response.status}`;
        try {
            const errBody = await response.json();
            if (errBody.message) errMessage = errBody.message;
        } catch {
            // ignore JSON parse error
        }
        throw new Error(errMessage);
    }

    return response.json() as Promise<T>;
}

// ── Auth Endpoints ───────────────────────────────────────────

export async function loginApi(email: string, password: string): Promise<{ token: string; user: User; message: string }> {
    return apiFetch<{ token: string; user: User; message: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export async function registerApi(name: string, email: string, password: string): Promise<{ user: User; message: string }> {
    return apiFetch<{ user: User; message: string }>('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
}

export async function validateMeApi(): Promise<{ user: User }> {
    return apiFetch<{ user: User }>('/api/auth/me');
}

// ── Energy Endpoints ─────────────────────────────────────────

/** GET /energy/realtime — latest single reading */
export async function getRealtimeEnergy(): Promise<EnergyMetrics> {
    if (USE_MOCK) return generateLiveMetrics();
    return apiFetch<EnergyMetrics>('/energy/realtime');
}

/** GET /energy/history — historical readings based on monitoring mode */
export async function getEnergyHistory(mode: MonitoringMode = 'hours'): Promise<EnergyHistoryPoint[]> {
    if (USE_MOCK) {
        switch (mode) {
            case 'hours': return generateHourlyHistory(24);
            case 'days': return generateDailyHistory(30);
            case 'weeks': return generateWeeklyHistory(12);
            case 'months': return generateMonthlyHistory(12);
            default: return generateHourlyHistory(24);
        }
    }
    return apiFetch<EnergyHistoryPoint[]>(`/energy/history?mode=${mode}`);
}

// ── Alert Endpoints ──────────────────────────────────────────

/** GET /alerts — list of all alerts */
export async function getAlerts(): Promise<Alert[]> {
    if (USE_MOCK) return [...MOCK_ALERTS];
    return apiFetch<Alert[]>('/alerts');
}

/** PATCH /alerts/:id/read — mark single alert as read */
export async function markAlertRead(id: string): Promise<void> {
    if (USE_MOCK) return;
    await apiFetch(`/alerts/${id}/read`, { method: 'PATCH' });
}

/** PATCH /alerts/read-all — mark all alerts as read */
export async function markAllAlertsRead(): Promise<void> {
    if (USE_MOCK) return;
    await apiFetch('/alerts/read-all', { method: 'PATCH' });
}

// ── Insights Endpoints ───────────────────────────────────────

/** GET /insights — appliance detection (NILM) results */
export async function getInsights(): Promise<Appliance[]> {
    if (USE_MOCK) return MOCK_APPLIANCES;
    return apiFetch<Appliance[]>('/insights');
}

// ── Goal Endpoints ───────────────────────────────────────────

/** GET /goals — list of active goals */
export async function getGoals(): Promise<Goal[]> {
    if (USE_MOCK) return MOCK_GOALS;
    return apiFetch<Goal[]>('/goals');
}

/** POST /goals — create a new goal */
export async function postGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    if (USE_MOCK) {
        return {
            ...goal,
            id: Math.random().toString(36).slice(2),
            createdAt: new Date().toISOString(),
        };
    }
    return apiFetch<Goal>('/goals', {
        method: 'POST',
        body: JSON.stringify(goal),
    });
}

/** DELETE /goals/:id */
export async function deleteGoal(id: string): Promise<void> {
    if (USE_MOCK) return;
    await apiFetch(`/goals/${id}`, { method: 'DELETE' });
}

// ── Settings Endpoints ───────────────────────────────────────

/** GET /settings */
export async function getSettings(): Promise<UserSettings> {
    if (USE_MOCK) return DEFAULT_SETTINGS;
    return apiFetch<UserSettings>('/settings');
}

/** PUT /settings */
export async function updateSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    if (USE_MOCK) return { ...DEFAULT_SETTINGS, ...settings };
    return apiFetch<UserSettings>('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
    });
}
