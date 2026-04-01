// ============================================================
// Energy Monitoring - TypeScript Types
// ============================================================

export type MonitoringMode = 'live' | 'hours' | 'days' | 'weeks' | 'months';

export interface User {
  id: string;
  email: string;
  name: string;
}

/** Matches backend DeviceResponseDto after mapping */
export interface Device {
  id: string;
  homeId: string;
  name: string;
  deviceType: string | null;
  createdAt?: string;
}

export interface EnergyMetrics {
  power: number;        // Watts (W)
  voltage: number;      // Volts (V)
  current: number;      // Amperes (A)
  energy: number;       // Kilowatt-hours (kWh)
  cost: number;         // Currency
  frequency?: number;   // Hz
  powerFactor?: number; // 0-1
  timestamp: string;    // ISO 8601
}

export interface EnergyHistoryPoint extends EnergyMetrics {
  label?: string; // for grouped charts (e.g. "Mon", "Jan")
  [key: string]: any;
}

export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertType = 'high_consumption' | 'anomaly' | 'night_usage' | 'goal_reached' | 'voltage_spike' | 'system';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  value?: number;
  unit?: string;
}

export interface Appliance {
  id: string;
  name: string;
  icon: string;           // Lucide icon name
  watts: number;          // Estimated power draw
  dailyHours: number;     // Estimated daily usage
  dailyKwh: number;
  percentage: number;     // % of total consumption
  color: string;          // Chart color
}

export type GoalPeriod = 'daily' | 'weekly' | 'monthly';
export type GoalMetric = 'energy' | 'cost' | 'power';

export interface Goal {
  id: string;
  metric: GoalMetric;
  period: GoalPeriod;
  target: number;
  current: number;
  unit: string;
  label: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;           // Lucide icon name
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;      // 0-100
  xp: number;
}

export interface UserSettings {
  max_power_threshold: number;    // W — warn above this
  night_threshold: number;        // W — warn for night usage above this
  price_per_kwh: number;          // e.g. 0.15
  currency: string;               // e.g. "USD"
  billing_start: number;          // Day 1–31
  enable_notifications: boolean;
  created_at: string;
}

export interface Home {
  id: string;
  name: string;
  location: string;
  timezone: string;
  devices?: Device[];
}

export interface ComparisonData {
  label: string;
  today: number;
  yesterday: number;
  [key: string]: any;
}

export interface EnergyBreakdown {
  name: string;
  value: number;
  color: string;
}

export interface EnergyStat {
  label: string;
  value: string | number;
  unit?: string;
  change?: number;      // % change vs previous period
  changeDir?: 'up' | 'down';
}

// WebSocket event payloads
export interface EnergyMetricsPayload {
  deviceId: string;
  timestamp: string;
  tags: {
    device_id: string;
    [key: string]: string;
  };
  metrics: {
    voltage: number;
    current: number;
    power_watts: number;
    energy_kwh: number;
    frequency: number;
    [key: string]: number | string;
  };
}

export interface SocketEnergyEvent {
  metrics: EnergyMetrics;
}

export interface SocketAlertEvent {
  alert: Alert;
}

// API response wrappers
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
