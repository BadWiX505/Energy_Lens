/**
 * Energy Repository — InfluxDB SQL Query Layer
 *
 * Measurement : Configured via INFLUX_ENERGY_METRICS_MEASUREMENT env var (default: energy_metrics_v3)
 * Tags        : device_id (string)
 * Fields      : voltage (float), current (float), power_watts (float),
 *               energy_kwh (float), frequency (float)
 *
 * energy_kwh is a monotonically-increasing cumulative meter reading.
 * Energy consumed in a bucket = MAX(energy_kwh) - MIN(energy_kwh).
 */

import { queryRows } from '../../common/influx/influx.handler';
import type {
  InfluxHistoryRow,
  InfluxPeriodRow,
  InfluxHourlyRow,
} from './energy.types';

const ENERGY_METRICS_MEASUREMENT = process.env.INFLUX_ENERGY_METRICS_MEASUREMENT || "energy_metrics_v3";

export class EnergyRepository {

  // ── Helpers ──────────────────────────────────────────────────

  /** Build a SQL IN-clause from device IDs (with escaping) */
  private deviceFilter(deviceIds: string[]): string {
    if (deviceIds.length === 0) return '1=0';
    return deviceIds.map(id => `'${id.replace(/'/g, "''")}'`).join(', ');
  }

  private normalizeInterval(interval: string): string {
    const normalized = interval
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');

    const mapped = normalized
      .replace(/hours?$/, 'h')
      .replace(/days?$/, 'd')
      .replace(/minutes?$/, 'm');

    if (/^\d+h$/.test(mapped) || /^\d+d$/.test(mapped) || /^\d+m$/.test(mapped)) {
      return mapped;
    }

    throw new Error(`Invalid interval format for InfluxDB SQL: ${interval}`);
  }

  // ── History queries (grouped chart data) ─────────────────────

  async getHourlyHistory(deviceIds: string[]): Promise<InfluxHistoryRow[]> {
    const sql = `
      SELECT
        DATE_BIN(INTERVAL '1h', time, TIMESTAMP '1970-01-01T00:00:00Z') AS period,
        AVG("power_watts")  AS avg_power,
        MAX("power_watts")  AS peak_power,
        MIN("power_watts")  AS min_power,
        AVG("voltage")      AS avg_voltage,
        AVG("current")      AS avg_current,
        AVG("frequency")    AS avg_frequency,
        MAX("energy_kwh") - MIN("energy_kwh") AS energy_consumed,
        COUNT(*)            AS samples
      FROM "${ENERGY_METRICS_MEASUREMENT}"
      WHERE time >= now() - INTERVAL '24h'
        AND "device_id" IN (${this.deviceFilter(deviceIds)})
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    return queryRows(sql) as Promise<InfluxHistoryRow[]>;
  }

  async getDailyHistory(deviceIds: string[]): Promise<InfluxHistoryRow[]> {
    const sql = `
      SELECT
        DATE_BIN(INTERVAL '1d', time, TIMESTAMP '1970-01-01T00:00:00Z') AS period,
        AVG("power_watts")  AS avg_power,
        MAX("power_watts")  AS peak_power,
        MIN("power_watts")  AS min_power,
        AVG("voltage")      AS avg_voltage,
        AVG("current")      AS avg_current,
        AVG("frequency")    AS avg_frequency,
        MAX("energy_kwh") - MIN("energy_kwh") AS energy_consumed,
        COUNT(*)            AS samples
      FROM "${ENERGY_METRICS_MEASUREMENT}"
      WHERE time >= now() - INTERVAL '30d'
        AND "device_id" IN (${this.deviceFilter(deviceIds)})
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    return queryRows(sql) as Promise<InfluxHistoryRow[]>;
  }

  async getWeeklyHistory(deviceIds: string[]): Promise<InfluxHistoryRow[]> {
    const sql = `
      SELECT
        DATE_BIN(INTERVAL '7d', time, TIMESTAMP '1970-01-01T00:00:00Z') AS period,
        AVG("power_watts")  AS avg_power,
        MAX("power_watts")  AS peak_power,
        MIN("power_watts")  AS min_power,
        AVG("voltage")      AS avg_voltage,
        AVG("current")      AS avg_current,
        AVG("frequency")    AS avg_frequency,
        MAX("energy_kwh") - MIN("energy_kwh") AS energy_consumed,
        COUNT(*)            AS samples
      FROM "${ENERGY_METRICS_MEASUREMENT}"
      WHERE time >= now() - INTERVAL '84d'
        AND "device_id" IN (${this.deviceFilter(deviceIds)})
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    return queryRows(sql) as Promise<InfluxHistoryRow[]>;
  }

  async getMonthlyHistory(deviceIds: string[]): Promise<InfluxHistoryRow[]> {
    const sql = `
      SELECT
        DATE_BIN(INTERVAL '30d', time, TIMESTAMP '1970-01-01T00:00:00Z') AS period,
        AVG("power_watts")  AS avg_power,
        MAX("power_watts")  AS peak_power,
        MIN("power_watts")  AS min_power,
        AVG("voltage")      AS avg_voltage,
        AVG("current")      AS avg_current,
        AVG("frequency")    AS avg_frequency,
        MAX("energy_kwh") - MIN("energy_kwh") AS energy_consumed,
        COUNT(*)            AS samples
      FROM "${ENERGY_METRICS_MEASUREMENT}"
      WHERE time >= now() - INTERVAL '365d'
        AND "device_id" IN (${this.deviceFilter(deviceIds)})
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    return queryRows(sql) as Promise<InfluxHistoryRow[]>;
  }

  // ── Summary queries (period totals) ──────────────────────────

  /** Get aggregated stats for a time range */
  async getPeriodStats(
    deviceIds: string[],
    interval: string
  ): Promise<InfluxPeriodRow | null> {
    const sql = `
      SELECT
        AVG("power_watts")  AS avg_power,
        MAX("power_watts")  AS peak_power,
        MAX("energy_kwh") - MIN("energy_kwh") AS energy_consumed
      FROM "${ENERGY_METRICS_MEASUREMENT}"
      WHERE time >= now() - INTERVAL '${this.normalizeInterval(interval)}'
        AND "device_id" IN (${this.deviceFilter(deviceIds)})
    `;
    const rows = await queryRows(sql);
    return rows.length > 0 ? (rows[0] as InfluxPeriodRow) : null;
  }

  /** Get stats between two absolute timestamps */
  async getPeriodStatsBetween(
    deviceIds: string[],
    start: string,
    end: string
  ): Promise<InfluxPeriodRow | null> {
    const sql = `
      SELECT
        AVG("power_watts")  AS avg_power,
        MAX("power_watts")  AS peak_power,
        MAX("energy_kwh") - MIN("energy_kwh") AS energy_consumed
      FROM "${ENERGY_METRICS_MEASUREMENT}"
      WHERE time >= '${start}'
        AND time < '${end}'
        AND "device_id" IN (${this.deviceFilter(deviceIds)})
    `;
    const rows = await queryRows(sql);
    return rows.length > 0 ? (rows[0] as InfluxPeriodRow) : null;
  }

  // ── Comparison queries (today vs yesterday, hourly) ──────────

  async getHourlyEnergyForDay(
    deviceIds: string[],
    dayStart: string,
    dayEnd: string
  ): Promise<InfluxHourlyRow[]> {
    const sql = `
      SELECT
        DATE_BIN(INTERVAL '1h', time, TIMESTAMP '1970-01-01T00:00:00Z') AS hour_bucket,
        MAX("energy_kwh") - MIN("energy_kwh") AS energy_consumed
      FROM "${ENERGY_METRICS_MEASUREMENT}"
      WHERE time >= '${dayStart}'
        AND time < '${dayEnd}'
        AND "device_id" IN (${this.deviceFilter(deviceIds)})
      GROUP BY 1
      ORDER BY 1 ASC
    `;
    return queryRows(sql) as Promise<InfluxHourlyRow[]>;
  }
}
