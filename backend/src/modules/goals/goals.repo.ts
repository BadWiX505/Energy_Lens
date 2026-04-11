/**
 * Goals Repository
 * Database access logic for energy goals and scores.
 */

import { prisma } from '../../common/config/prisma';
import type { CreateGoalInput } from './goals.types';
import { EnergyGoal, EnergyScore } from '../../generated/prisma/client';

export class GoalsRepository {

  /** Get all goals for a home */
  async getByHome(homeId: string): Promise<EnergyGoal[]> {
    return prisma.energyGoal.findMany({
      where: { homeId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Create a new goal.
   * Throws if (homeId, type, targetMetric) already exists — caller should handle P2002.
   */
  async create(input: CreateGoalInput, endDate: Date): Promise<EnergyGoal> {
    return prisma.energyGoal.create({
      data: {
        homeId: input.homeId,
        type: input.type,
        targetValue: input.targetValue,
        targetMetric: input.targetMetric,
        duration: input.duration,
        endDate,
        label: input.label ?? `${input.type} ${input.targetMetric} goal`,
        status: 'active',
      },
    });
  }

  /** Delete a goal by id */
  async delete(id: string): Promise<EnergyGoal> {
    return prisma.energyGoal.delete({ where: { id } });
  }

  /** Mark a goal as achieved */
  async markAchieved(id: string): Promise<void> {
    await prisma.energyGoal.update({ where: { id }, data: { status: 'achieved' } });
  }

  /** Mark a goal as missed */
  async markMissed(id: string): Promise<void> {
    await prisma.energyGoal.update({ where: { id }, data: { status: 'missed' } });
  }

  /** Get all unread EnergyScore rows for a home */
  async getUnreadScores(homeId: string): Promise<EnergyScore[]> {
    return prisma.energyScore.findMany({
      where: { homeId, isRead: false },
      orderBy: { date: 'desc' },
    });
  }

  /** Get all EnergyScore rows for a home (history) */
  async getAllScores(homeId: string): Promise<EnergyScore[]> {
    return prisma.energyScore.findMany({
      where: { homeId },
      orderBy: { date: 'desc' },
      take: 50,
    });
  }

  /** Mark an EnergyScore row as read */
  async markScoreRead(scoreId: string): Promise<void> {
    await prisma.energyScore.update({
      where: { id: scoreId },
      data: { isRead: true },
    });
  }

  /**
   * Award points:
   *  - CREATE a new EnergyScore row (one row per award event)
   *  - Increment Home.totalScore atomically
   */
  async awardScore(homeId: string, points: number, scoreType: string, label?: string): Promise<EnergyScore> {
    return prisma.$transaction(async (tx) => {
      const score = await tx.energyScore.create({
        data: { homeId, score: points, type: scoreType, label: label ?? null, isRead: false },
      });

      await tx.home.update({
        where: { id: homeId },
        data: { totalScore: { increment: points } },
      });

      return score;
    });
  }

  /** Get Home.totalScore */
  async getTotalScore(homeId: string): Promise<number> {
    const home = await prisma.home.findUnique({
      where: { id: homeId },
      select: { totalScore: true },
    });
    return home?.totalScore ?? 0;
  }
}
