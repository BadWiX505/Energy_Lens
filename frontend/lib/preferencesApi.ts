// Preferences API — /api/preferences (per-home), maps DTOs ↔ UserSettings

import type { UserSettings } from '@/types';
import { apiFetch } from '@/lib/api';

// ── Defaults when API returns nulls or no row exists yet ─────

function defaultFormSettings(): UserSettings {
    const now = new Date().toISOString();
    return {
        max_power_threshold: 3000,
        night_threshold: 500,
        price_per_kwh: 0.15,
        currency: 'USD',
        billing_start: 1,
        enable_notifications: true,
        created_at: now,
    };
}

// ── Wire DTOs (backend camelCase) ─────────────────────────────

export type CreatePreferenceDto = {
    homeId: string;
    maxPowerThreshold?: number;
    nightThreshold?: number;
    pricePerKwh?: number;
    currency?: string;
    billingStart?: number;
    enableNotifications?: boolean;
};

type PreferenceResponseDto = {
    id: string;
    homeId: string;
    maxPowerThreshold: number | null;
    nightThreshold: number | null;
    pricePerKwh: number | null;
    currency: string | null;
    billingStart: number | null;
    enableNotifications: boolean | null;
    createdAt: string | Date | null;
};

const D = defaultFormSettings();

function preferenceDtoToUserSettings(dto: PreferenceResponseDto): UserSettings {
    const createdAt =
        dto.createdAt == null
            ? new Date().toISOString()
            : typeof dto.createdAt === 'string'
              ? dto.createdAt
              : new Date(dto.createdAt).toISOString();
    return {
        max_power_threshold: dto.maxPowerThreshold ?? D.max_power_threshold,
        night_threshold: dto.nightThreshold ?? D.night_threshold,
        price_per_kwh: dto.pricePerKwh ?? D.price_per_kwh,
        currency: dto.currency ?? D.currency,
        billing_start: dto.billingStart ?? D.billing_start,
        enable_notifications: dto.enableNotifications ?? D.enable_notifications,
        created_at: createdAt,
    };
}

function userSettingsToCreateDto(homeId: string, s: UserSettings): CreatePreferenceDto {
    return {
        homeId,
        maxPowerThreshold: s.max_power_threshold,
        nightThreshold: s.night_threshold,
        pricePerKwh: s.price_per_kwh,
        currency: s.currency,
        billingStart: s.billing_start,
        enableNotifications: s.enable_notifications,
    };
}

function isNotFoundError(message: string): boolean {
    return /not\s*found|\b404\b/i.test(message);
}

/** GET /api/preferences?homeId= — returns null if no preference row exists */
export async function getPreferenceByHomeApi(homeId: string): Promise<UserSettings | null> {
    const params = new URLSearchParams({ homeId });
    try {
        const dto = await apiFetch<PreferenceResponseDto>(`/api/preferences?${params.toString()}`);
        return preferenceDtoToUserSettings(dto);
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (isNotFoundError(msg)) return null;
        throw e;
    }
}

type CreatePreferenceResponse = {
    message?: string;
    preference: PreferenceResponseDto;
};

/** POST /api/preferences — create a new preference record for the home */
export async function createPreferenceApi(homeId: string, settings: UserSettings): Promise<UserSettings> {
    const body = userSettingsToCreateDto(homeId, settings);
    const res = await apiFetch<CreatePreferenceResponse>('/api/preferences', {
        method: 'POST',
        body: JSON.stringify(body),
    });
    return preferenceDtoToUserSettings(res.preference);
}

export { defaultFormSettings };
