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

import type { EnergyHistoryPoint, EnergySummary, Alert, Appliance, Goal, UserSettings, User, Home, Device, Tip, Achievement, EnergyScore, CommunityStats, GoalsPageData } from '@/types';
import { useAuthStore } from '@/store/authStore';
import {
    MOCK_ALERTS,
    MOCK_APPLIANCES,
    MOCK_GOALS,
    DEFAULT_SETTINGS,
} from '@/lib/mockData';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

// ── Internal fetch wrapper ───────────────────────────────────

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
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
        throw Object.assign(new Error(errMessage), { status: response.status });
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

/** GET /api/energy/history — historical readings grouped by mode for a device */
export async function getEnergyHistory(
    deviceId: string,
    mode: 'hours' | 'days' | 'weeks' | 'months' = 'hours'
): Promise<EnergyHistoryPoint[]> {
    const params = new URLSearchParams({ deviceId, mode });
    const response = await apiFetch<{ data: EnergyHistoryPoint[] }>(`/api/energy/history?${params}`);
    return response.data || [];
}

/** GET /api/energy/summary — energy summary stats for a device */
export async function getEnergySummary(deviceId: string): Promise<EnergySummary> {
    return apiFetch<EnergySummary>(`/api/energy/summary?deviceId=${deviceId}`);
}

/** GET /api/energy/comparison — today vs yesterday hourly comparison for a device */
export async function getEnergyComparison(
    deviceId: string
): Promise<{ label: string; today: number; yesterday: number }[]> {
    const response = await apiFetch<{ data: { label: string; today: number; yesterday: number }[] }>(
        `/api/energy/comparison?deviceId=${deviceId}`
    );
    return response.data || [];
}

// ── Alert Endpoints ──────────────────────────────────────────

/** GET /api/alerts?homeId=... — list of all alerts */
export async function getAlerts(homeId: string): Promise<Alert[]> {
    return apiFetch<Alert[]>(`/api/alerts?homeId=${homeId}`);
}

/** POST /api/alerts/:id/read — mark single alert as read */
export async function markAlertRead(id: string): Promise<void> {
    await apiFetch(`/api/alerts/${id}/read`, { method: 'POST' });
}

/** DELETE /api/alerts/:id — delete alert permanently */
export async function deleteAlertFromApi(id: string): Promise<void> {
    await apiFetch(`/api/alerts/${id}`, { method: 'DELETE' });
}

/** DELETE /api/alerts?homeId=... — delete ALL alerts for a home */
export async function deleteAllAlertsFromApi(homeId: string): Promise<void> {
    await apiFetch(`/api/alerts?homeId=${homeId}`, { method: 'DELETE' });
}

// ── Tips Endpoints ───────────────────────────────────────────

/** GET /api/tips?homeId=... — list all tips for a home */
export async function getTips(homeId: string): Promise<Tip[]> {
    return apiFetch<Tip[]>(`/api/tips?homeId=${homeId}`);
}

/** DELETE /api/tips/:id — delete a single tip */
export async function deleteTipFromApi(id: string): Promise<void> {
    await apiFetch(`/api/tips/${id}`, { method: 'DELETE' });
}

/** DELETE /api/tips?homeId=... — delete ALL tips for a home */
export async function deleteAllTipsFromApi(homeId: string): Promise<void> {
    await apiFetch(`/api/tips?homeId=${homeId}`, { method: 'DELETE' });
}

// ── Insights Endpoints ───────────────────────────────────────

/** GET /api/insights?deviceId=... — appliance detection (NILM) results for a specific device */
export async function getInsights(deviceId: string): Promise<Appliance[]> {
    if (USE_MOCK) return MOCK_APPLIANCES;
    return apiFetch<Appliance[]>(`/api/insights?deviceId=${encodeURIComponent(deviceId)}`);
}

// ── Goal Endpoints (/api/goals) ───────────────────────────────

/**
 * GET /api/goals?homeId= — triggers goal processing, returns goals + score data
 */
export async function getGoals(homeId: string): Promise<GoalsPageData> {
    const raw = await apiFetch<{
        goals: Array<{
            id: string; homeId: string; type: string; targetValue: number;
            targetMetric: string; label: string; status: string;
            current: number; unit: string; duration: number;
            endDate: string; daysRemaining: number; createdAt: string;
        }>;
        totalScore: number;
        newScores: EnergyScore[];
        energyScores: EnergyScore[];
    }>(`/api/goals?homeId=${encodeURIComponent(homeId)}`);

    return {
        goals: raw.goals.map((g) => ({
            id: g.id,
            label: g.label,
            period: g.type as Goal['period'],
            metric: g.targetMetric as Goal['metric'],
            target: g.targetValue,
            current: g.current,
            unit: g.unit,
            status: g.status,
            duration: g.duration,
            endDate: g.endDate,
            daysRemaining: g.daysRemaining,
            createdAt: g.createdAt,
        })),
        totalScore: raw.totalScore,
        newScores: raw.newScores ?? [],
        energyScores: raw.energyScores ?? [],
    };
}

/**
 * POST /api/goals — create a goal
 * Backend: { homeId, type, targetValue, targetMetric, duration, label? }
 */
export async function postGoal(goal: {
    homeId: string;
    type: string;
    targetValue: number;
    targetMetric: string;
    duration: number;
    label?: string;
}): Promise<Goal> {
    const raw = await apiFetch<{
        id: string; homeId: string; type: string; targetValue: number;
        targetMetric: string; label: string; status: string;
        current: number; unit: string; duration: number;
        endDate: string; daysRemaining: number; createdAt: string;
    }>('/api/goals', { method: 'POST', body: JSON.stringify(goal) });

    return {
        id: raw.id,
        label: raw.label,
        period: raw.type as Goal['period'],
        metric: raw.targetMetric as Goal['metric'],
        target: raw.targetValue,
        current: raw.current,
        unit: raw.unit,
        status: raw.status,
        duration: raw.duration,
        endDate: raw.endDate,
        daysRemaining: raw.daysRemaining,
        createdAt: raw.createdAt,
    };
}

/** DELETE /api/goals/:id */
export async function deleteGoal(id: string): Promise<void> {
    await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
}

/** PATCH /api/goals/scores/:id/read — dismiss a score notification */
export async function markScoreRead(scoreId: string): Promise<void> {
    await apiFetch(`/api/goals/scores/${scoreId}/read`, { method: 'PATCH' });
}

// ── Achievements Endpoints (/api/achievements) ────────────────

/**
 * GET /api/achievements?homeId= — process achievements, return with community stats
 */
export async function getAchievements(homeId: string): Promise<{
    achievements: Achievement[];
    communityStats: CommunityStats;
    newAchievements: Achievement[];
    totalScore: number;
}> {
    const raw = await apiFetch<{
        achievements: Array<{
            id: string; name: string; description: string; lucideIconName: string;
            scoreValue: number; unlocked: boolean; earnedAt?: string;
            isRead: boolean; userAchievementId?: string;
        }>;
        communityStats: CommunityStats;
        newAchievements: Array<{
            id: string; name: string; description: string; lucideIconName: string;
            scoreValue: number; unlocked: boolean; earnedAt?: string;
            isRead: boolean; userAchievementId?: string;
        }>;
        totalScore: number;
    }>(`/api/achievements?homeId=${encodeURIComponent(homeId)}`);

    const mapAch = (a: typeof raw.achievements[0]): Achievement => ({
        id: a.id,
        name: a.name,
        description: a.description,
        icon: a.lucideIconName,
        xp: a.scoreValue,
        unlocked: a.unlocked,
        unlockedAt: a.earnedAt,
        isRead: a.isRead,
        userAchievementId: a.userAchievementId,
    });

    return {
        achievements: raw.achievements.map(mapAch),
        communityStats: raw.communityStats,
        newAchievements: raw.newAchievements.map(mapAch),
        totalScore: raw.totalScore ?? 0,
    };
}

/** PATCH /api/achievements/:id/read — dismiss achievement celebration */
export async function markAchievementRead(userAchievementId: string): Promise<void> {
    await apiFetch(`/api/achievements/${userAchievementId}/read`, { method: 'PATCH' });
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

// ── Homes Endpoints (/api/homes) ──────────────────────────────

// Backend DTO alignment:
// CreateHomeDto: { userId: string; name: string; location?: string }
// UpdateHomeDto: { name?: string; location?: string }
type HomeResponseDto = {
    id: string;
    userId: string;
    name: string | null;
    location: string | null;
    createdAt: string | Date;
};

export type CreateHomeInput = {
    name: string;
    location?: string;
};

export type UpdateHomeInput = {
    name?: string;
    location?: string;
};

function mapHomeDtoToHome(dto: HomeResponseDto): Home {
    return {
        id: dto.id,
        name: dto.name ?? '',
        location: dto.location ?? '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
}

/** POST /api/homes — create a new home */
export async function createHomeApi(input: CreateHomeInput): Promise<Home> {
    const userId = typeof window !== 'undefined' ? useAuthStore.getState().user?.id : undefined;
    if (!userId) throw new Error('Missing user. Please sign in again.');

    const created = await apiFetch<HomeResponseDto>('/api/homes', {
        method: 'POST',
        body: JSON.stringify({ userId, ...input }),
    });
    return mapHomeDtoToHome(created);
}

/** GET /api/homes — list my homes */
export async function getMyHomesApi(): Promise<Home[]> {
    const data = await apiFetch<HomeResponseDto[]>('/api/homes');
    return (data || []).map(mapHomeDtoToHome);
}

/** GET /api/homes/:id — get one home */
export async function getHomeByIdApi(id: string): Promise<Home> {
    const data = await apiFetch<HomeResponseDto>(`/api/homes/${id}`);
    return mapHomeDtoToHome(data);
}

/** PUT /api/homes/:id — update home */
export async function updateHomeApi(id: string, patch: UpdateHomeInput): Promise<Home> {
    const updated = await apiFetch<HomeResponseDto>(`/api/homes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
    });
    return mapHomeDtoToHome(updated);
}

/** DELETE /api/homes/:id */
export async function deleteHomeApi(id: string): Promise<void> {
    await apiFetch<void>(`/api/homes/${id}`, { method: 'DELETE' });
}

// ── Devices Endpoints (/api/devices) ────────────────────────────
// Backend: associate POST /associate; list GET /?homeId=; get GET /:id?homeId=;
// update PUT /:id?homeId=; disassociate DELETE /:id?homeId=

type DeviceResponseDto = {
    id: string;
    homeId: string | null;
    name: string | null;
    deviceType: string | null;
    createdAt: string | Date;
};

function mapDeviceDto(dto: DeviceResponseDto): Device {
    const createdAt =
        dto.createdAt == null
            ? undefined
            : typeof dto.createdAt === 'string'
              ? dto.createdAt
              : new Date(dto.createdAt).toISOString();
    return {
        id: dto.id,
        homeId: dto.homeId ?? '',
        name: dto.name ?? '',
        deviceType: dto.deviceType,
        createdAt,
    };
}

function deviceQuery(homeId: string) {
    const params = new URLSearchParams({ homeId });
    return params.toString();
}

export type AssociateDeviceInput = {
    deviceId: string;
    homeId: string;
    name: string;
};

export type UpdateDeviceInput = {
    name?: string;
};

/** POST /api/devices/associate */
export async function associateDeviceApi(input: AssociateDeviceInput): Promise<Device> {
    const res = await apiFetch<{ message?: string; device: DeviceResponseDto }>('/api/devices/associate', {
        method: 'POST',
        body: JSON.stringify(input),
    });
    return mapDeviceDto(res.device);
}

/** GET /api/devices?homeId=… */
export async function getDevicesByHomeApi(
    homeId: string,
    opts?: { skip?: number; take?: number }
): Promise<Device[]> {
    const params = new URLSearchParams({ homeId });
    if (opts?.skip != null) params.set('skip', String(opts.skip));
    if (opts?.take != null) params.set('take', String(opts.take));
    const data = await apiFetch<DeviceResponseDto[]>(`/api/devices?${params.toString()}`);
    return (data || []).map(mapDeviceDto);
}

/** GET /api/devices/:id?homeId=… */
export async function getDeviceByIdApi(deviceId: string, homeId: string): Promise<Device> {
    const data = await apiFetch<DeviceResponseDto>(`/api/devices/${encodeURIComponent(deviceId)}?${deviceQuery(homeId)}`);
    return mapDeviceDto(data);
}

/** PUT /api/devices/:id?homeId=… */
export async function updateDeviceApi(deviceId: string, homeId: string, patch: UpdateDeviceInput): Promise<Device> {
    const res = await apiFetch<{ message?: string; device: DeviceResponseDto }>(
        `/api/devices/${encodeURIComponent(deviceId)}?${deviceQuery(homeId)}`,
        {
            method: 'PUT',
            body: JSON.stringify(patch),
        }
    );
    return mapDeviceDto(res.device);
}

/** DELETE /api/devices/:id?homeId=… */
export async function disassociateDeviceApi(deviceId: string, homeId: string): Promise<Device> {
    const res = await apiFetch<{ message?: string; device: DeviceResponseDto }>(
        `/api/devices/${encodeURIComponent(deviceId)}?${deviceQuery(homeId)}`,
        { method: 'DELETE' }
    );
    return mapDeviceDto(res.device);
}
