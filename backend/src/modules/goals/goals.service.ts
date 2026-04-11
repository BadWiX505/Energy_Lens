/**
 * Goals Service
 * Core business logic: goal creation, progress evaluation, and score awarding.
 *
 * Goal lifecycle:
 *   active  → still within window and threshold not exceeded → show live progress
 *   active  → exceeded threshold → mark 'missed' (no points)
 *   active  → window ends and threshold never exceeded → mark 'achieved' (award points)
 *   achieved / missed → terminal, never re-evaluated
 */

import { Prisma } from '../../generated/prisma/client';
import { prisma } from '../../common/config/prisma';
import { GoalsRepository } from './goals.repo';
import { EnergyRepository } from '../energy/energy.repo';
import {
  CreateGoalInput,
  GoalResponse,
  GoalsPageResponse,
  GoalType,
  GoalMetric,
  GOAL_SCORE_VALUES,
  MAX_TARGET,
  PERIOD_MS,
} from './goals.types';

export class GoalsService {
  private repo = new GoalsRepository();
  private energyRepo = new EnergyRepository();

  // ── Helpers ──────────────────────────────────────────────────

  private async validateHomeOwnership(homeId: string, userId: string): Promise<void> {
    const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
    if (!home) throw new Error('Home not found or access denied');
  }

  private async getHomeDeviceIds(homeId: string): Promise<string[]> {
    const devices = await prisma.device.findMany({
      where: { homeId },
      select: { id: true },
    });
    return devices.map((d) => d.id);
  }

  private async getPricePerKwh(homeId: string): Promise<number> {
    const pref = await prisma.preference.findFirst({
      where: { homeId },
      orderBy: { createdAt: 'desc' },
      select: { pricePerKwh: true },
    });
    return pref?.pricePerKwh ?? 0.15;
  }

  private unitFor(metric: GoalMetric): string {
    if (metric === 'energy') return 'kWh';
    if (metric === 'power') return 'W';
    return 'cost';
  }

  /** Days remaining until endDate (negative = ended) */
  private daysRemaining(endDate: Date): number {
    const msLeft = endDate.getTime() - Date.now();
    return Math.ceil(msLeft / (24 * 60 * 60 * 1000));
  }

  // ── Public methods ───────────────────────────────────────────

  /**
   * Main page-load entry point.
   * Evaluates each goal's state against its [createdAt, endDate] window.
   */
  async processGoals(homeId: string, userId: string): Promise<GoalsPageResponse> {
    await this.validateHomeOwnership(homeId, userId);

    const [goals, deviceIds, pricePerKwh] = await Promise.all([
      this.repo.getByHome(homeId),
      this.getHomeDeviceIds(homeId),
      this.getPricePerKwh(homeId),
    ]);

    if (goals.length === 0) {
      const totalScore = await this.repo.getTotalScore(homeId);
      return { goals: [], totalScore, newScores: [], energyScores: [] };
    }

    const now = new Date();

    // Collect unique (createdAt, endDate) windows needing Influx queries
    // (only for non-terminal goals)
    type InfluxKey = string; // `${createdAt.toISOString()}_${endDate.toISOString()}`
    const windowsNeeded = new Map<InfluxKey, { start: Date; end: Date }>();
    for (const goal of goals) {
      if (goal.status === 'achieved' || goal.status === 'missed') continue;
      const key: InfluxKey = `${goal.createdAt.toISOString()}_${goal.endDate.toISOString()}`;
      if (!windowsNeeded.has(key)) {
        windowsNeeded.set(key, { start: goal.createdAt, end: goal.endDate });
      }
    }

    // Fetch Influx stats for each unique window in parallel
    type StatsResult = { energyKwh: number; peakPower: number };
    const statsMap = new Map<InfluxKey, StatsResult>();

    await Promise.all(
      Array.from(windowsNeeded.entries()).map(async ([key, { start, end }]) => {
        if (deviceIds.length === 0) {
          statsMap.set(key, { energyKwh: 0, peakPower: 0 });
          return;
        }
        const row = await this.energyRepo.getPeriodStatsBetween(
          deviceIds,
          start.toISOString(),
          end.toISOString()
        );
        statsMap.set(key, {
          energyKwh: Number(row?.energy_consumed ?? 0),
          peakPower: Number(row?.peak_power ?? 0),
        });
      })
    );

    // Evaluate each goal
    const results: GoalResponse[] = [];

    for (const goal of goals) {
      const type = goal.type as GoalType;
      const metric = goal.targetMetric as GoalMetric;
      const endDate = goal.endDate;
      const dr = this.daysRemaining(endDate);

      let currentStatus = goal.status;
      let current = 0;

      if (goal.status !== 'achieved' && goal.status !== 'missed') {
        // Compute current value from Influx
        const key: InfluxKey = `${goal.createdAt.toISOString()}_${endDate.toISOString()}`;
        const stats = statsMap.get(key) ?? { energyKwh: 0, peakPower: 0 };

        if (metric === 'energy') current = parseFloat(stats.energyKwh.toFixed(3));
        else if (metric === 'cost') current = parseFloat((stats.energyKwh * pricePerKwh).toFixed(2));
        else if (metric === 'power') current = parseFloat(stats.peakPower.toFixed(1));

        const exceeded = current > goal.targetValue;

        if (exceeded) {
          // User broke the threshold — goal missed immediately
          await this.repo.markMissed(goal.id);
          currentStatus = 'missed';
        } else if (now >= endDate) {
          // Window ended and threshold was never exceeded — award points!
          const pts = GOAL_SCORE_VALUES[type];
          const label = `${goal.label ?? `${type} ${metric} goal`} completed`;
          await this.repo.awardScore(homeId, pts, 'goal', label);
          await this.repo.markAchieved(goal.id);
          currentStatus = 'achieved';
        }
        // else: still active, in progress
      }

      results.push({
        id: goal.id,
        homeId: goal.homeId,
        type,
        targetValue: goal.targetValue,
        targetMetric: metric,
        duration: goal.duration,
        label: goal.label ?? `${type} ${metric} goal`,
        status: currentStatus,
        current,
        unit: this.unitFor(metric),
        endDate: endDate.toISOString(),
        daysRemaining: dr,
        createdAt: goal.createdAt.toISOString(),
      });
    }

    const [totalScore, newScores, allScores] = await Promise.all([
      this.repo.getTotalScore(homeId),
      this.repo.getUnreadScores(homeId),
      this.repo.getAllScores(homeId),
    ]);

    return {
      goals: results,
      totalScore,
      newScores: newScores.map((s) => ({
        id: s.id,
        homeId: s.homeId,
        score: s.score ?? 0,
        type: s.type ?? 'goal',
        label: s.label ?? undefined,
        date: s.date instanceof Date ? s.date.toISOString() : String(s.date ?? new Date()),
        isRead: s.isRead ?? false,
      })),
      energyScores: allScores.map((s) => ({
        id: s.id,
        homeId: s.homeId,
        score: s.score ?? 0,
        type: s.type ?? 'goal',
        label: s.label ?? undefined,
        date: s.date instanceof Date ? s.date.toISOString() : String(s.date ?? new Date()),
        isRead: s.isRead ?? false,
      })),
    } as GoalsPageResponse;
  }

  /** Create a new goal (fails on duplicate type+metric for this home) */
  async createGoal(input: CreateGoalInput, userId: string): Promise<GoalResponse> {
    await this.validateHomeOwnership(input.homeId, userId);

    if (input.duration < 1 || input.duration > 365) {
      throw new Error('Duration must be between 1 and 365.');
    }
    if (input.targetValue <= 0) {
      throw new Error('Target value must be greater than 0.');
    }
    const max = MAX_TARGET[input.type]?.[input.targetMetric];
    if (max !== undefined && input.targetValue > max) {
      throw new Error(
        `Target value ${input.targetValue} exceeds the maximum allowed (${max}) for a ${input.type} ${input.targetMetric} goal.`
      );
    }

    const endDate = new Date(Date.now() + input.duration * PERIOD_MS[input.type]);

    try {
      const goal = await this.repo.create(input, endDate);
      return {
        id: goal.id,
        homeId: goal.homeId,
        type: goal.type as GoalType,
        targetValue: goal.targetValue,
        targetMetric: goal.targetMetric as GoalMetric,
        duration: goal.duration,
        label: goal.label ?? `${goal.type} ${goal.targetMetric} goal`,
        status: goal.status,
        current: 0,
        unit: this.unitFor(goal.targetMetric as GoalMetric),
        endDate: goal.endDate.toISOString(),
        daysRemaining: this.daysRemaining(goal.endDate),
        createdAt: goal.createdAt.toISOString(),
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new Error(
          `A ${input.type} goal tracking ${input.targetMetric} already exists for this home. Delete it first to create a new one.`
        );
      }
      throw err;
    }
  }

  /** Delete a goal by ID */
  async deleteGoal(goalId: string, userId: string): Promise<void> {
    const goal = await prisma.energyGoal.findFirst({
      where: { id: goalId, home: { userId } },
    });
    if (!goal) throw new Error('Goal not found or access denied');
    await this.repo.delete(goalId);
  }

  /** Mark a score entry as read */
  async markScoreRead(scoreId: string, userId: string): Promise<void> {
    const score = await prisma.energyScore.findFirst({
      where: { id: scoreId, home: { userId } },
    });
    if (!score) throw new Error('Score not found or access denied');
    await this.repo.markScoreRead(scoreId);
  }
}
