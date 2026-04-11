/**
 * Achievements Repository
 * Database access for achievements and user achievements.
 */

import { prisma } from '../../common/config/prisma';
import { Achievement, UserAchievement } from '../../generated/prisma/client';

export class AchievementsRepository {

  /** Get all pre-seeded achievements */
  async getAll(): Promise<Achievement[]> {
    return prisma.achievement.findMany({ orderBy: { scoreValue: 'asc' } });
  }

  /** Get all user achievements for a home (with achievement data) */
  async getUserAchievements(homeId: string): Promise<(UserAchievement & { achievement: Achievement })[]> {
    return prisma.userAchievement.findMany({
      where: { homeId },
      include: { achievement: true },
    });
  }

  /**
   * Create a user achievement entry.
   * Skips silently if the achievement is already earned (@@unique constraint).
   */
  async createIfNotExists(homeId: string, achievementId: string): Promise<UserAchievement | null> {
    try {
      return await prisma.userAchievement.create({
        data: { homeId, achievementId, isRead: false },
      });
    } catch {
      // Unique constraint violation — already earned
      return null;
    }
  }

  /** Mark a user achievement as read */
  async markRead(userAchievementId: string): Promise<void> {
    await prisma.userAchievement.update({
      where: { id: userAchievementId },
      data: { isRead: true },
    });
  }

  /** Get community stats: avg, max, count of home scores, homes beaten */
  async getCommunityAgg(homeId: string): Promise<{
    avgScore: number;
    topScore: number;
    totalHomes: number;
    homesBeat: number;
    yourScore: number;
  }> {
    const [agg, home, homesBeat] = await Promise.all([
      prisma.home.aggregate({
        _avg: { totalScore: true },
        _max: { totalScore: true },
        _count: { id: true },
      }),
      prisma.home.findUnique({ where: { id: homeId }, select: { totalScore: true } }),
      prisma.home.count({
        where: {
          totalScore: { lt: (await prisma.home.findUnique({ where: { id: homeId }, select: { totalScore: true } }))?.totalScore ?? 0 },
        },
      }),
    ]);

    return {
      avgScore: Math.round(agg._avg.totalScore ?? 0),
      topScore: agg._max.totalScore ?? 0,
      totalHomes: agg._count.id,
      homesBeat,
      yourScore: home?.totalScore ?? 0,
    };
  }
}
