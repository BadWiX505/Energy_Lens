/**
 * Goals Module — Type Definitions
 */

export type GoalType = 'daily' | 'weekly' | 'monthly';
export type GoalMetric = 'energy' | 'cost' | 'power';

/** Score awarded when a goal window is completed successfully */
export const GOAL_SCORE_VALUES: Record<GoalType, number> = {
  daily: 10,
  weekly: 25,
  monthly: 50,
};

/** Maximum allowed target values (conservative ceilings) */
export const MAX_TARGET: Record<GoalType, Record<GoalMetric, number>> = {
  daily:   { energy: 500,   cost: 500,   power: 50000 },
  weekly:  { energy: 3500,  cost: 3500,  power: 50000 },
  monthly: { energy: 15000, cost: 15000, power: 50000 },
};

/** Period length in milliseconds (used to compute endDate) */
export const PERIOD_MS: Record<GoalType, number> = {
  daily:   1 * 24 * 60 * 60 * 1000,
  weekly:  7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
};

export interface CreateGoalInput {
  homeId: string;
  type: GoalType;
  targetValue: number;
  targetMetric: GoalMetric;
  duration: number;  // how many periods (e.g. 3 for "3 days")
  label?: string;
}

export interface GoalResponse {
  id: string;
  homeId: string;
  type: GoalType;
  targetValue: number;
  targetMetric: GoalMetric;
  duration: number;
  label: string;
  status: string;        // 'active' | 'achieved' | 'missed'
  current: number;       // computed from Influx
  unit: string;          // 'kWh' | 'cost' | 'W'
  endDate: string;       // ISO datetime
  daysRemaining: number; // negative means ended
  createdAt: string;
}

export interface EnergyScore {
  id: string;
  homeId: string;
  score: number;
  type: string;
  label?: string;
  date: string;
  isRead: boolean;
}

export interface GoalsPageResponse {
  goals: GoalResponse[];
  totalScore: number;
  newScores: EnergyScore[];
  energyScores: EnergyScore[];  // full history (up to 50 rows)
}
