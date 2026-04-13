/**
 * Tips Generator Orchestrator
 *
 * Called from mqtt.handler.ts on every MQTT payload (fire-and-forget).
 *
 * Flow:
 *  1. Per-device concurrency guard (skip if already processing this device)
 *  2. Resolve deviceId → homeId         (5-min TTL cache)
 *  3. Per-home interval gate            (in-memory; DB cold-start fallback on restart)
 *  4. Resolve homeId → all device IDs  (5-min TTL cache, for InfluxDB filtering)
 *  5. Query InfluxDB for energy context (correct MAX-MIN energy delta, DATE_BIN grouped)
 *  6. Minimum sample validation
 *  7. AI tip generation
 *  8. Persist to database + EventBus emit for WebSocket delivery
 */

import { prisma } from '../../common/config/prisma';
import { queryRows } from '../../common/influx/influx.handler';
import { eventBus } from '../../events/eventBus';
import { getTips } from '../../common/gemeni/gemeni.process';
import { TipsService } from './tips.service';
import type { EnergyUsageData } from '../../common/gemeni/gemeni.service';
import type { CreateTipInput } from './tips.types';

// ────────────────────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────────────────────

const TIPS_GENERATION_INTERVAL_MINUTES = parseInt(
    process.env.TIPS_GENERATION_INTERVAL_MINUTES || '30',
    10
);
const TIPS_MIN_REQUIRED_SAMPLES = parseInt(
    process.env.TIPS_MIN_REQUIRED_SAMPLES || '10',
    10
);
const TIPS_MAX_PER_GENERATION = parseInt(
    process.env.TIPS_MAX_PER_GENERATION || '3',
    10
);

const DEVICE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min
const ENERGY_MEASUREMENT = process.env.INFLUX_ENERGY_METRICS_MEASUREMENT || 'energy_metrics_v3';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

/**
 * Safe number coercion — InfluxDB v3 returns BigInt via Arrow format for COUNT(*).
 * Handles BigInt, number, string, null, undefined.
 */
function safeNum(val: unknown): number {
    if (typeof val === 'bigint') return Number(val);
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const n = parseFloat(String(val ?? '0'));
    return isNaN(n) ? 0 : n;
}

/**
 * Build a SQL IN-clause value list from device IDs.
 * Same pattern as energy.repo.ts — escapes single-quotes.
 */
function deviceFilter(deviceIds: string[]): string {
    if (deviceIds.length === 0) return "'__no_match__'";
    return deviceIds.map(id => `'${id.replace(/'/g, "''")}'`).join(', ');
}

// ────────────────────────────────────────────────────────────────────────────
// Cache types
// ────────────────────────────────────────────────────────────────────────────

interface CachedDeviceHome {
    homeId: string | null;
    cachedAt: number;
}

interface CachedHomeDevices {
    deviceIds: string[];
    cachedAt: number;
}

// ────────────────────────────────────────────────────────────────────────────
// TipsGenerator
// ────────────────────────────────────────────────────────────────────────────

class TipsGenerator {
    private readonly service = new TipsService();

    /** deviceId → homeId (TTL cache) */
    private readonly deviceToHomeCache = new Map<string, CachedDeviceHome>();

    /** homeId → device IDs for InfluxDB filtering (TTL cache) */
    private readonly homeDevicesCache = new Map<string, CachedHomeDevices>();

    /**
     * homeId → last generation timestamp in-memory.
     * Populated from DB on cold-start so server restarts respect the interval.
     */
    private readonly homeLastGenerationTime = new Map<string, number>();

    /** Per-device concurrency guard (prevents overlapping runs for same device) */
    private readonly processingDevices = new Set<string>();

    // ── Resolution helpers ────────────────────────────────────────────────

    private async resolveHomeId(deviceId: string): Promise<string | null> {
        const now = Date.now();
        const cached = this.deviceToHomeCache.get(deviceId);
        if (cached && now - cached.cachedAt < DEVICE_CACHE_TTL_MS) {
            return cached.homeId;
        }
        try {
            const device = await prisma.device.findUnique({
                where: { id: deviceId },
                select: { homeId: true },
            });
            const homeId = device?.homeId ?? null;
            this.deviceToHomeCache.set(deviceId, { homeId, cachedAt: now });
            return homeId;
        } catch (err) {
            console.error(`[TipsGenerator] Error resolving device ${deviceId}:`, err);
            return null;
        }
    }

    private async resolveHomeDeviceIds(homeId: string): Promise<string[]> {
        const now = Date.now();
        const cached = this.homeDevicesCache.get(homeId);
        if (cached && now - cached.cachedAt < DEVICE_CACHE_TTL_MS) {
            return cached.deviceIds;
        }
        try {
            const devices = await prisma.device.findMany({
                where: { homeId },
                select: { id: true },
            });
            const deviceIds = devices.map(d => d.id);
            this.homeDevicesCache.set(homeId, { deviceIds, cachedAt: now });
            return deviceIds;
        } catch (err) {
            console.error(`[TipsGenerator] Error resolving devices for home ${homeId}:`, err);
            return [];
        }
    }

    // ── Interval gate ─────────────────────────────────────────────────────

    /**
     * Returns true if enough time has passed since the last generation.
     * In-memory fast-path; falls back to DB on cold-start (server restart).
     */
    private async shouldGenerateForHome(homeId: string): Promise<boolean> {
        const now = Date.now();
        const intervalMs = TIPS_GENERATION_INTERVAL_MINUTES * 60_000;

        // Fast path: already tracked in memory
        const lastMs = this.homeLastGenerationTime.get(homeId);
        if (lastMs !== undefined) {
            const elapsed = now - lastMs;
            if (elapsed < intervalMs) {
                console.debug(
                    `[TipsGenerator] Skipping home ${homeId} — ${(elapsed / 60_000).toFixed(1)}/${TIPS_GENERATION_INTERVAL_MINUTES} min elapsed`
                );
                return false;
            }
            return true;
        }

        // Cold-start: check the database to respect the interval across restarts
        try {
            const lastGenerated = await this.service.getLastGenerationTime(homeId);
            if (lastGenerated) {
                const dbLastMs = lastGenerated.getTime();
                this.homeLastGenerationTime.set(homeId, dbLastMs); // warm the cache
                const elapsed = now - dbLastMs;
                if (elapsed < intervalMs) {
                    console.debug(
                        `[TipsGenerator] Cold-start gate: home ${homeId} last generated ${(elapsed / 60_000).toFixed(1)} min ago`
                    );
                    return false;
                }
            }
        } catch (err) {
            console.error(`[TipsGenerator] Error checking last generation time:`, err);
        }

        return true;
    }

    // ── Energy context ────────────────────────────────────────────────────

    /**
     * Query InfluxDB for 24h and 7d energy context for a set of device IDs.
     *
     * Uses MAX(energy_kwh) - MIN(energy_kwh) for energy delta because
     * energy_kwh is a monotonically-increasing cumulative meter reading.
     * Uses DATE_BIN (InfluxDB v3 SQL dialect) — matches energy.repo.ts.
     */
    private async collectEnergyContext(homeId: string, deviceIds: string[]): Promise<EnergyUsageData | null> {
        try {
            const filter = deviceFilter(deviceIds);

            // 24h aggregate: energy delta, power stats, sample count
            const rows24h = await queryRows(`
                SELECT
                    MAX("power_watts") - MIN("power_watts")   AS power_range,
                    MAX("power_watts")                         AS peak_power,
                    AVG("power_watts")                         AS avg_power,
                    MAX("energy_kwh") - MIN("energy_kwh")      AS total_energy,
                    COUNT(*)                                   AS sample_count
                FROM "${ENERGY_MEASUREMENT}"
                WHERE time >= now() - INTERVAL '24h'
                  AND "device_id" IN (${filter})
            `);

            const row24h = rows24h[0] ?? {};
            const sampleCount = safeNum(row24h.sample_count);

            if (sampleCount < TIPS_MIN_REQUIRED_SAMPLES) {
                console.warn(
                    `[TipsGenerator] Insufficient data for home ${homeId}: ${sampleCount}/${TIPS_MIN_REQUIRED_SAMPLES} samples`
                );
                return null;
            }

            // 7d total energy — simple aggregate, divide by 7 for daily average
            // Avoids nested subqueries which are unreliable in InfluxDB v3
            const rows7d = await queryRows(`
                SELECT
                    MAX("energy_kwh") - MIN("energy_kwh") AS total_energy_7d
                FROM "${ENERGY_MEASUREMENT}"
                WHERE time >= now() - INTERVAL '7d'
                  AND "device_id" IN (${filter})
            `);

            const row7d = rows7d[0] ?? {};
            const avgDaily7d = safeNum(row7d.total_energy_7d) / 7;

            // Home name + preferences
            const [home, prefs] = await Promise.all([
                prisma.home.findUnique({ where: { id: homeId }, select: { name: true } }),
                prisma.preference.findFirst({ where: { homeId }, orderBy: { createdAt: 'desc' } }),
            ]);

            const totalLast24h = safeNum(row24h.total_energy);
            const pricePerKwh = prefs?.pricePerKwh ?? 0.15;

            const context: EnergyUsageData = {
                homeId,
                homeName: home?.name ?? undefined,
                totalLast24hEnergyKwh: parseFloat(totalLast24h.toFixed(4)),
                totalLast7dAverageKwh: parseFloat(avgDaily7d.toFixed(4)),
                peakPowerWattsLast24h: parseFloat(safeNum(row24h.peak_power).toFixed(2)),
                averagePowerWattsLast24h: parseFloat(safeNum(row24h.avg_power).toFixed(2)),
                estimatedMonthlyCostUsd: parseFloat((totalLast24h * 30 * pricePerKwh).toFixed(2)),
                pricePerKwhUsd: pricePerKwh,
                maxPowerThresholdWatts: prefs?.maxPowerThreshold ?? undefined,
                nightThresholdWatts: prefs?.nightThreshold ?? undefined,
                timestamp: new Date().toISOString(),
                dataSourceDevices: deviceIds,
            };

            return context;
        } catch (err) {
            console.error(`[TipsGenerator] Error collecting context for home ${homeId}:`, err);
            return null;
        }
    }

    // ── Generation + persistence ──────────────────────────────────────────

    private async generateAndPersistTips(homeId: string, context: EnergyUsageData): Promise<void> {
        try {
            const tips = await getTips(context);
            if (!tips || tips.length === 0) {
                console.warn(`[TipsGenerator] No tips returned for home ${homeId}`);
                this.homeLastGenerationTime.set(homeId, Date.now());
                return;
            }

            const tipInputs: CreateTipInput[] = tips.slice(0, TIPS_MAX_PER_GENERATION).map(tip => ({
                homeId,
                imageUrls: tip.imageUrls,
                title: tip.title,
                description: tip.description,
                categoryTag: tip.categoryTag,
                estimatedSavings: tip.estimatedSavings,
                metadata: {
                    totalEnergy24h: context.totalLast24hEnergyKwh,
                    peakPower24h: context.peakPowerWattsLast24h,
                    generatedAt: new Date().toISOString(),
                },
            }));

            const persisted = await this.service.createTipsInternal(tipInputs);
            console.log(`[TipsGenerator] Persisted ${persisted.length} tip(s) for home ${homeId}`);

            // Emit one EventBus event per tip → socket.bridge forwards to WebSocket
            for (const tip of persisted) {
                eventBus.emit('event:tip:generated', {
                    tipId: tip.id,
                    homeId,
                    imageUrls: tip.imageUrls,
                    title: tip.title,
                    description: tip.description,
                    categoryTag: tip.categoryTag,
                    estimatedSavings: tip.estimatedSavings,
                    timestamp: new Date().toISOString(),
                });
            }

          
        } catch (err) {
            console.error(`[TipsGenerator] Error generating/persisting tips for home ${homeId}:`, err);
        }finally{
           // Update in-memory tracking AFTER successful persistence
            this.homeLastGenerationTime.set(homeId, Date.now());
        }
    }

    // ── Public entrypoint ─────────────────────────────────────────────────

    /**
     * Called from mqtt.handler.ts on every payload — must be fire-and-forget.
     * Internally gated by concurrency lock and interval gate.
     */
    async checkAndGenerateTips(deviceId: string): Promise<void> {
        // Concurrency guard: skip if already processing this device
        if (this.processingDevices.has(deviceId)) {
            return;
        }
        this.processingDevices.add(deviceId);

        try {
            // 1. Device → home
            const homeId = await this.resolveHomeId(deviceId);
            if (!homeId) {
                console.debug(`[TipsGenerator] Device ${deviceId} is not associated with any home`);
                return;
            }

            // 2. Interval gate (memory + DB cold-start)
            if (!(await this.shouldGenerateForHome(homeId))) {
                return;
            }

            // 3. Home → all device IDs (InfluxDB filter)
            const homeDeviceIds = await this.resolveHomeDeviceIds(homeId);
            if (homeDeviceIds.length === 0) {
                console.warn(`[TipsGenerator] Home ${homeId} has no devices in DB`);
                return;
            }

            // 4. Collect InfluxDB context
            const context = await this.collectEnergyContext(homeId, homeDeviceIds);
            if (!context) {
                return;
            }

            // 5. Generate + persist
            await this.generateAndPersistTips(homeId, context);
        } catch (err) {
            console.error(`[TipsGenerator] Unexpected error for device ${deviceId}:`, err);
        } finally {
            this.processingDevices.delete(deviceId);
        }
    }

    /** Reset all caches (useful for testing or manual admin reset) */
    clearCache(): void {
        this.deviceToHomeCache.clear();
        this.homeDevicesCache.clear();
        this.homeLastGenerationTime.clear();
        this.processingDevices.clear();
        console.log('[TipsGenerator] All caches cleared');
    }
}

export const tipsGenerator = new TipsGenerator();

