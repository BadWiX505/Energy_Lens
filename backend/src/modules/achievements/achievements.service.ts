/**
 * Achievements Service
 *
 * EXTENDING ACHIEVEMENTS:
 * 1. Seed a new row into the `achievements` table (name, description, lucide_icon_name, score_value)
 * 2. Add its UUID to the ACH_IDS map
 * 3. Add one entry to ACHIEVEMENT_CHECKERS with the condition function
 * No other changes needed.
 */

import { prisma } from '../../common/config/prisma';
import { AchievementsRepository } from './achievements.repo';
import { GoalsRepository } from '../goals/goals.repo';
import type {
  AchievementResponse,
  AchievementsPageResponse,
  CommunityStats,
} from './achievements.types';

// ── Achievement IDs (seeded in migration) ────────────────────

const ACH_IDS = {
  FIRST_STEP:      'a1000000-0000-0000-0000-000000000001',
  SCORE_STARTER:   'a1000000-0000-0000-0000-000000000002',
  TRIPLE_THREAT:   'a1000000-0000-0000-0000-000000000003',
  WEEKLY_WARRIOR:  'a1000000-0000-0000-0000-000000000004',
  MONTHLY_PLANNER: 'a1000000-0000-0000-0000-000000000005',
  BUDGET_GUARDIAN: 'a1000000-0000-0000-0000-000000000006',
  POWER_TRACKER:   'a1000000-0000-0000-0000-000000000007',
  CENTURION:       'a1000000-0000-0000-0000-000000000008',
};

// ── Context object passed to every checker ────────────────────

interface AchievementContext {
  goalsCount: number;
  achievedGoalsCount: number;
  hasWeeklyGoal: boolean;
  hasMonthlyGoal: boolean;
  hasCostGoal: boolean;
  hasPowerGoal: boolean;
  scoresCount: number;
  totalScore: number;
}

// ── Checker registry ──────────────────────────────────────────
// To add a new achievement: seed to DB + add one entry here.

interface AchievementChecker {
  achievementId: string;
  check: (ctx: AchievementContext) => boolean;
}

const ACHIEVEMENT_CHECKERS: AchievementChecker[] = [
  { achievementId: ACH_IDS.FIRST_STEP,      check: (c) => c.goalsCount >= 1 },
  { achievementId: ACH_IDS.SCORE_STARTER,   check: (c) => c.scoresCount >= 1 },
  { achievementId: ACH_IDS.TRIPLE_THREAT,   check: (c) => c.goalsCount >= 3 },
  { achievementId: ACH_IDS.WEEKLY_WARRIOR,  check: (c) => c.hasWeeklyGoal },
  { achievementId: ACH_IDS.MONTHLY_PLANNER, check: (c) => c.hasMonthlyGoal },
  { achievementId: ACH_IDS.BUDGET_GUARDIAN, check: (c) => c.hasCostGoal },
  { achievementId: ACH_IDS.POWER_TRACKER,   check: (c) => c.hasPowerGoal },
  { achievementId: ACH_IDS.CENTURION,       check: (c) => c.totalScore >= 100 },
];

// ─────────────────────────────────────────────────────────────

export class AchievementsService {
  private repo = new AchievementsRepository();
  private goalsRepo = new GoalsRepository();

  private async validateHomeOwnership(homeId: string, userId: string): Promise<void> {
    const home = await prisma.home.findFirst({ where: { id: homeId, userId } });
    if (!home) throw new Error('Home not found or access denied');
  }

  /**
   * Called on Goals page load (after processGoals).
   * Evaluates the checker registry and awards newly-earned achievements.
   */
  async processAchievements(homeId: string, userId: string): Promise<AchievementsPageResponse> {
    await this.validateHomeOwnership(homeId, userId);

    // Build context in parallel
    const [allAchievements, userAchievements, goals, scoresCount, home] = await Promise.all([
      this.repo.getAll(),
      this.repo.getUserAchievements(homeId),
      prisma.energyGoal.findMany({ where: { homeId } }),
      prisma.energyScore.count({ where: { homeId } }),
      prisma.home.findUnique({ where: { id: homeId }, select: { totalScore: true } }),
    ]);

    const ctx: AchievementContext = {
      goalsCount:          goals.length,
      achievedGoalsCount:  goals.filter((g) => g.status === 'achieved').length,
      hasWeeklyGoal:       goals.some((g) => g.type === 'weekly'),
      hasMonthlyGoal:      goals.some((g) => g.type === 'monthly'),
      hasCostGoal:         goals.some((g) => g.targetMetric === 'cost'),
      hasPowerGoal:        goals.some((g) => g.targetMetric === 'power'),
      scoresCount,
      totalScore:          home?.totalScore ?? 0,
    };

    const earnedIds = new Set(userAchievements.map((ua) => ua.achievementId));

    // Run checkers and award new achievements
    for (const checker of ACHIEVEMENT_CHECKERS) {
      if (checker.check(ctx) && !earnedIds.has(checker.achievementId)) {
        const created = await this.repo.createIfNotExists(homeId, checker.achievementId);
        if (created) {
          earnedIds.add(checker.achievementId);
          const ach = allAchievements.find((a) => a.id === checker.achievementId);
          const pts = ach?.scoreValue ?? 0;
          if (pts > 0) {
            const achName = ach?.name ?? 'Achievement';
            await this.goalsRepo.awardScore(homeId, pts, 'achievement', `${achName} unlocked`);
          }
          userAchievements.push({ ...created, achievement: ach! });
        }
      }
    }

    // Build response
    const earnedMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]));

    const achievements: AchievementResponse[] = allAchievements.map((ach) => {
      const ua = earnedMap.get(ach.id);
      return {
        id: ach.id,
        name: ach.name ?? '',
        description: ach.description ?? '',
        lucideIconName: ach.lucideIconName ?? 'Trophy',
        scoreValue: ach.scoreValue ?? 0,
        unlocked: !!ua,
        earnedAt: ua?.earnedAt?.toISOString(),
        isRead: ua?.isRead ?? true,
        userAchievementId: ua?.id,
      };
    });

    const newAchievements = achievements.filter((a) => a.unlocked && !a.isRead);

    const stats = await this.repo.getCommunityAgg(homeId);
    const communityStats: CommunityStats = {
      yourScore: stats.yourScore,
      avgScore: stats.avgScore,
      topScore: stats.topScore,
      totalHomes: stats.totalHomes,
      yourPercentile: stats.totalHomes > 0
        ? Math.round((stats.homesBeat / stats.totalHomes) * 100)
        : 0,
    };

    // Re-fetch totalScore after all awards so caller gets the final up-to-date value
    const freshHome = await prisma.home.findUnique({ where: { id: homeId }, select: { totalScore: true } });
    const totalScore = freshHome?.totalScore ?? 0;

    return { achievements, communityStats, newAchievements, totalScore };
  }

  /** Mark a user achievement as read */
  async markRead(userAchievementId: string, userId: string): Promise<void> {
    const ua = await prisma.userAchievement.findFirst({
      where: { id: userAchievementId, home: { userId } },
    });
    if (!ua) throw new Error('Achievement not found or access denied');
    await this.repo.markRead(userAchievementId);
  }
}
