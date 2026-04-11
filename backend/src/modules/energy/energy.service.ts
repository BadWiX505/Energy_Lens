/**
 * Energy Service
 * Business logic: device ownership, InfluxDB data retrieval, and response mapping.
 *
 * All endpoints are device-centric: the caller provides a deviceId and
 * the service validates the user has access (device → home → user).
 */

import { prisma } from '../../common/config/prisma';
import { EnergyRepository } from './energy.repo';
import type {
  HistoryMode,
  EnergyHistoryPoint,
  EnergySummary,
  ComparisonPoint,
  InfluxHistoryRow,
} from './energy.types';

export class EnergyService {
  private repo = new EnergyRepository();

  // ── Helpers ──────────────────────────────────────────────────

  /**
   * Verify the authenticated user owns the given device.
   * Chain: device → home → user
   */
  async validateDeviceOwnership(deviceId: string, userId: string): Promise<boolean> {
    const device = await prisma.device.findFirst({
      where: { id: deviceId },
      include: { home: true },
    });
    if (!device || !device.home) return false;
    return device.home.userId === userId;
  }

  private async getBillingSettings(deviceId: string): Promise<{
    homeId: string | null;
    pricePerKwh: number;
    billingStart: number;
  }> {
    const device = await prisma.device.findFirst({
      where: { id: deviceId },
      select: { homeId: true },
    });
    if (!device?.homeId) {
      return {
        homeId: null,
        pricePerKwh: 0.15,
        billingStart: 1,
      };
    }

    const pref = await prisma.preference.findMany({
      where: { homeId: device.homeId },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { pricePerKwh: true, billingStart: true },
    });

    return {
      homeId: device.homeId,
      pricePerKwh:
        pref.length > 0 && pref[0].pricePerKwh != null
          ? pref[0].pricePerKwh
          : 0.15,
      billingStart:
        pref.length > 0 && pref[0].billingStart != null
          ? Math.min(Math.max(pref[0].billingStart, 1), 31)
          : 1,
    };
  }

  private cycleBoundaryUtc(year: number, monthIndex: number, billingStart: number): Date {
    const day = Math.min(
      Math.max(billingStart, 1),
      new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
    );
    return new Date(Date.UTC(year, monthIndex, day));
  }

  private getBillingCycleBounds(now: Date, billingStart: number) {
    const currentMonthBoundary = this.cycleBoundaryUtc(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      billingStart
    );

    const currentStart = now >= currentMonthBoundary
      ? currentMonthBoundary
      : this.cycleBoundaryUtc(now.getUTCFullYear(), now.getUTCMonth() - 1, billingStart);

    const nextStart = this.cycleBoundaryUtc(
      currentStart.getUTCFullYear(),
      currentStart.getUTCMonth() + 1,
      billingStart
    );

    const previousStart = this.cycleBoundaryUtc(
      currentStart.getUTCFullYear(),
      currentStart.getUTCMonth() - 1,
      billingStart
    );

    return {
      currentStart,
      nextStart,
      previousStart,
    };
  }

  // ── Date parsing (handles InfluxDB v3 timestamp formats) ─────

  /**
   * InfluxDB v3 client may return timestamps as:
   * - Date objects
   * - ISO strings
   * - epoch numbers (ms or s)
   * - BigInt nanoseconds
   * This helper normalises all to a JS Date.
   */
  private toDate(raw: any): Date {
    if (raw instanceof Date) return raw;
    if (typeof raw === 'bigint') return new Date(Number(raw / 1000000n)); // ns → ms
    if (typeof raw === 'number') {
      // If it looks like seconds (< 1e12), convert to ms
      return new Date(raw < 1e12 ? raw * 1000 : raw);
    }
    if (typeof raw === 'string') return new Date(raw);
    return new Date(); // fallback
  }

  // ── Label formatting ─────────────────────────────────────────

  private formatLabel(raw: any, mode: HistoryMode, index: number): string {
    const d = this.toDate(raw);
    if (isNaN(d.getTime())) return `P${index + 1}`;

    switch (mode) {
      case 'hours':
        return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      case 'days':
        return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
      case 'weeks':
        return `W${index + 1}`;
      case 'months':
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      default:
        return `P${index + 1}`;
    }
  }

  // ── Row → response mapping ────────────────────────────────────

  private mapHistoryRow(
    row: InfluxHistoryRow,
    mode: HistoryMode,
    index: number,
    pricePerKwh: number
  ): EnergyHistoryPoint {
    const energy = this.safeNum(row.energy_consumed);
    const d = this.toDate(row.period);
    return {
      label: this.formatLabel(row.period, mode, index),
      timestamp: isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(),
      power: this.safeNum(row.avg_power),
      voltage: this.safeNum(row.avg_voltage),
      current: this.safeNum(row.avg_current),
      energy: parseFloat(energy.toFixed(4)),
      cost: parseFloat((energy * pricePerKwh).toFixed(4)),
      frequency: this.safeNum(row.avg_frequency),
      power_peak: this.safeNum(row.peak_power),
      power_min: this.safeNum(row.min_power),
    };
  }

  private safeNum(val: any): number {
    const n = Number(val);
    return isNaN(n) ? 0 : parseFloat(n.toFixed(2));
  }

  // ── Public methods ───────────────────────────────────────────

  /**
   * GET /api/energy/history?deviceId=&mode=
   * Returns grouped history points for the selected mode
   */
  async getHistory(
    deviceId: string,
    userId: string,
    mode: HistoryMode
  ): Promise<EnergyHistoryPoint[]> {
    if (!(await this.validateDeviceOwnership(deviceId, userId))) {
      throw new Error('Device not found or access denied');
    }

    const { pricePerKwh } = await this.getBillingSettings(deviceId);

    let rows: InfluxHistoryRow[];
    switch (mode) {
      case 'hours':
        rows = await this.repo.getHourlyHistory([deviceId]);
        break;
      case 'days':
        rows = await this.repo.getDailyHistory([deviceId]);
        break;
      case 'weeks':
        rows = await this.repo.getWeeklyHistory([deviceId]);
        break;
      case 'months':
        rows = await this.repo.getMonthlyHistory([deviceId]);
        break;
      default:
        rows = [];
    }

    return rows.map((row, i) => this.mapHistoryRow(row, mode, i, pricePerKwh));
  }

  /**
   * GET /api/energy/summary?deviceId=
   * Returns summary stats: today, this week, this month, last month + trend
   */
  async getSummary(deviceId: string, userId: string): Promise<EnergySummary> {
    if (!(await this.validateDeviceOwnership(deviceId, userId))) {
      throw new Error('Device not found or access denied');
    }

    const { pricePerKwh, billingStart } = await this.getBillingSettings(deviceId);

    const empty: EnergySummary = {
      today: { energy: 0, cost: 0, peak: 0 },
      thisWeek: { energy: 0, cost: 0, avgDaily: 0 },
      thisMonth: { energy: 0, cost: 0, projectedFull: 0, daysRemaining: 0 },
      lastMonth: { energy: 0, cost: 0 },
      billingCycle: {
        energy: 0,
        cost: 0,
        projectedEnergy: 0,
        projectedCost: 0,
        avgDailyEnergy: 0,
        avgDailyCost: 0,
        daysElapsed: 0,
        daysRemaining: 0,
        totalDays: 0,
        startDate: new Date(0).toISOString(),
        endDate: new Date(0).toISOString(),
        previousEnergy: 0,
        previousCost: 0,
      },
      trend: 'stable',
      trendPercent: 0,
    };

    // Date boundaries (UTC)
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const startOfLastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const daysInMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0).getDate();
    const currentDay = now.getUTCDate();
    const daysRemaining = daysInMonth - currentDay;
    const { currentStart, nextStart, previousStart } = this.getBillingCycleBounds(now, billingStart);
    const msPerDay = 24 * 60 * 60 * 1000;
    const totalCycleDays = Math.max(1, (nextStart.getTime() - currentStart.getTime()) / msPerDay);
    const elapsedCycleDays = Math.max(1, (now.getTime() - currentStart.getTime()) / msPerDay);
    const remainingCycleDays = Math.max(0, Math.ceil((nextStart.getTime() - now.getTime()) / msPerDay));

    // Run queries in parallel
    const [todayStats, weekStats, monthStats, lastMonthStats, billingCycleStats, previousBillingCycleStats] = await Promise.all([
      this.repo.getPeriodStatsBetween(
        [deviceId], startOfToday.toISOString(), now.toISOString()
      ),
      this.repo.getPeriodStats([deviceId], '7d'),
      this.repo.getPeriodStatsBetween(
        [deviceId], startOfMonth.toISOString(), now.toISOString()
      ),
      this.repo.getPeriodStatsBetween(
        [deviceId], startOfLastMonth.toISOString(), startOfMonth.toISOString()
      ),
      this.repo.getPeriodStatsBetween(
        [deviceId], currentStart.toISOString(), now.toISOString()
      ),
      this.repo.getPeriodStatsBetween(
        [deviceId], previousStart.toISOString(), currentStart.toISOString()
      ),
    ]);

    const todayEnergy = this.safeNum(todayStats?.energy_consumed);
    const weekEnergy = this.safeNum(weekStats?.energy_consumed);
    const monthEnergy = this.safeNum(monthStats?.energy_consumed);
    const lastMonthEnergy = this.safeNum(lastMonthStats?.energy_consumed);
    const billingCycleEnergy = this.safeNum(billingCycleStats?.energy_consumed);
    const previousBillingCycleEnergy = this.safeNum(previousBillingCycleStats?.energy_consumed);

    // Trend calculation
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercent = 0;
    if (lastMonthEnergy > 0) {
      trendPercent = ((monthEnergy - lastMonthEnergy) / lastMonthEnergy) * 100;
      trend = trendPercent > 1 ? 'up' : trendPercent < -1 ? 'down' : 'stable';
    }

    // Projected full month
    const projectedFull = currentDay > 0
      ? monthEnergy * (daysInMonth / currentDay)
      : 0;
    const avgDailyBillingEnergy = billingCycleEnergy / elapsedCycleDays;
    const projectedBillingEnergy = avgDailyBillingEnergy * totalCycleDays;

    return {
      today: {
        energy: parseFloat(todayEnergy.toFixed(2)),
        cost: parseFloat((todayEnergy * pricePerKwh).toFixed(2)),
        peak: this.safeNum(todayStats?.peak_power),
      },
      thisWeek: {
        energy: parseFloat(weekEnergy.toFixed(2)),
        cost: parseFloat((weekEnergy * pricePerKwh).toFixed(2)),
        avgDaily: parseFloat((weekEnergy / 7).toFixed(2)),
      },
      thisMonth: {
        energy: parseFloat(monthEnergy.toFixed(2)),
        cost: parseFloat((monthEnergy * pricePerKwh).toFixed(2)),
        projectedFull: parseFloat(projectedFull.toFixed(2)),
        daysRemaining,
      },
      lastMonth: {
        energy: parseFloat(lastMonthEnergy.toFixed(2)),
        cost: parseFloat((lastMonthEnergy * pricePerKwh).toFixed(2)),
      },
      billingCycle: {
        energy: parseFloat(billingCycleEnergy.toFixed(2)),
        cost: parseFloat((billingCycleEnergy * pricePerKwh).toFixed(2)),
        projectedEnergy: parseFloat(projectedBillingEnergy.toFixed(2)),
        projectedCost: parseFloat((projectedBillingEnergy * pricePerKwh).toFixed(2)),
        avgDailyEnergy: parseFloat(avgDailyBillingEnergy.toFixed(2)),
        avgDailyCost: parseFloat((avgDailyBillingEnergy * pricePerKwh).toFixed(2)),
        daysElapsed: parseFloat(elapsedCycleDays.toFixed(1)),
        daysRemaining: remainingCycleDays,
        totalDays: parseFloat(totalCycleDays.toFixed(1)),
        startDate: currentStart.toISOString(),
        endDate: nextStart.toISOString(),
        previousEnergy: parseFloat(previousBillingCycleEnergy.toFixed(2)),
        previousCost: parseFloat((previousBillingCycleEnergy * pricePerKwh).toFixed(2)),
      },
      trend,
      trendPercent: parseFloat(trendPercent.toFixed(1)),
    };
  }

  /**
   * GET /api/energy/comparison?deviceId=
   * Returns today vs yesterday comparison (hourly buckets)
   */
  async getComparison(deviceId: string, userId: string): Promise<ComparisonPoint[]> {
    if (!(await this.validateDeviceOwnership(deviceId, userId))) {
      throw new Error('Device not found or access denied');
    }

    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

    const [todayRows, yesterdayRows] = await Promise.all([
      this.repo.getHourlyEnergyForDay(
        [deviceId], startOfToday.toISOString(), endOfToday.toISOString()
      ),
      this.repo.getHourlyEnergyForDay(
        [deviceId], startOfYesterday.toISOString(), startOfToday.toISOString()
      ),
    ]);

    // Build map: hour (0-23) → energy
    const todayMap = new Map<number, number>();
    const yesterdayMap = new Map<number, number>();

    for (const row of todayRows) {
      const d = this.toDate(row.hour_bucket);
      if (!isNaN(d.getTime())) {
        todayMap.set(d.getUTCHours(), this.safeNum(row.energy_consumed));
      }
    }
    for (const row of yesterdayRows) {
      const d = this.toDate(row.hour_bucket);
      if (!isNaN(d.getTime())) {
        yesterdayMap.set(d.getUTCHours(), this.safeNum(row.energy_consumed));
      }
    }

    // Build comparison for standard hours
    const hours = [0, 3, 6, 9, 12, 15, 18, 21];
    return hours.map(h => ({
      label: `${h.toString().padStart(2, '0')}:00`,
      today: todayMap.get(h) ?? 0,
      yesterday: yesterdayMap.get(h) ?? 0,
    }));
  }
}
