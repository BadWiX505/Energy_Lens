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

import type { EnergyMetrics, EnergyHistoryPoint, Alert, Appliance, Goal, UserSettings } from '@/types';
import type { MonitoringMode } from '@/types';
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

// ── Internal fetch wrapper ───────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            // Add your auth headers here, e.g.:
            // 'Authorization': `Bearer ${token}`,
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API error ${response.status}: ${response.statusText}`);
    }

    return response.json() as Promise<T>;
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
