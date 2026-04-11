/**
 * Energy Module — Type Definitions
 * Aligned with frontend types/index.ts
 */

// ── Request types ────────────────────────────────────────────

export type HistoryMode = 'hours' | 'days' | 'weeks' | 'months';

// ── Response types ───────────────────────────────────────────

/** Single grouped data point for the area/line chart */
export interface EnergyHistoryPoint {
  label: string;
  timestamp: string;
  power: number;          // avg power (W)
  voltage: number;        // avg voltage (V)
  current: number;        // avg current (A)
  energy: number;         // energy consumed in bucket (kWh)
  cost: number;           // energy × pricePerKwh
  frequency: number;      // avg frequency (Hz)
  power_peak: number;     // max power in bucket (W)
  power_min: number;      // min power in bucket (W)
}

/** Dashboard summary — matches frontend EnergySummary */
export interface EnergySummary {
  today: {
    energy: number;       // kWh consumed today
    cost: number;         // today cost
    peak: number;         // max power today (W)
  };
  thisWeek: {
    energy: number;       // kWh this week
    cost: number;
    avgDaily: number;     // average daily kWh
  };
  thisMonth: {
    energy: number;       // kWh this month
    cost: number;
    projectedFull: number; // projected full-month kWh
    daysRemaining: number;
  };
  lastMonth: {
    energy: number;
    cost: number;
  };
  billingCycle: {
    energy: number;
    cost: number;
    projectedEnergy: number;
    projectedCost: number;
    avgDailyEnergy: number;
    avgDailyCost: number;
    daysElapsed: number;
    daysRemaining: number;
    totalDays: number;
    startDate: string;
    endDate: string;
    previousEnergy: number;
    previousCost: number;
  };
  trend: 'up' | 'down' | 'stable';
  trendPercent: number;
}

/** Today vs Yesterday comparison point (bar chart) */
export interface ComparisonPoint {
  label: string;          // hour label e.g. "06:00"
  today: number;          // kWh consumed in that hour today
  yesterday: number;      // kWh consumed in that hour yesterday
}

// ── Internal / InfluxDB raw row types ────────────────────────

export interface InfluxHistoryRow {
  period: Date | string;
  avg_power: number;
  peak_power: number;
  min_power: number;
  avg_voltage: number;
  avg_current: number;
  avg_frequency: number;
  energy_consumed: number;
  samples: number;
}

export interface InfluxPeriodRow {
  avg_power: number;
  peak_power: number;
  energy_consumed: number;
}

export interface InfluxHourlyRow {
  hour_bucket: Date | string;
  energy_consumed: number;
}
