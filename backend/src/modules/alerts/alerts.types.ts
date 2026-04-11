/**
 * Alerts Module - Type Definitions
 */

// ── Alert Severity Levels ──────────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'critical';

// ── Alert Rule Types ───────────────────────────────────────────
export type AlertRuleType = 
  | 'overvoltage'
  | 'undervoltage'
  | 'maxPower'
  | 'nightMode'
  | 'powerSpike'
  | 'deviceOffline'
  | 'lowBattery'
  | 'sustainedHigh'
  | 'costThreshold'
  | 'applianceAnomaly';

// ── Alert Rule Configuration ───────────────────────────────────
export interface AlertRuleConfig {
  id: AlertRuleType;
  name: string;
  severity: AlertSeverity;
  enabled: boolean;
  description: string;
}

// ── Alert Triggers ─────────────────────────────────────────────
export interface AlertTrigger {
  ruleType: AlertRuleType;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

// ── Database Model ─────────────────────────────────────────────
// Matches the database schema for an Alert
export interface AlertModel {
  id: string;
  homeId: string;
  type?: string;           // 'info' | 'warning' | 'critical'
  ruleType?: string;       // 'overvoltage' | 'nightMode' | etc.
  message?: string;
  metadata?: Record<string, any>; // JSON field for rule-specific context
  isRead?: boolean;
  createdAt: Date;
}

// Data required to trigger/create an alert
export interface CreateAlertInput {
  homeId: string;
  type: AlertSeverity;
  ruleType?: AlertRuleType;
  message: string;
  metadata?: Record<string, any>;
}
