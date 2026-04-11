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

import type { EnergyHistoryPoint, EnergySummary, Alert, Appliance, Goal, UserSettings, User, Home, Device, Tip } from '@/types';
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
