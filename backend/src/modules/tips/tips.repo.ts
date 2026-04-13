/**
 * Tips Repository
 * Database access logic for tips using Prisma.
 * Follows the tri-layer pattern: Repository → Service → Controller
 */

import { prisma } from '../../common/config/prisma';
import type { CreateTipInput, TipModel, TipResponseDto, mapTipModelToDto } from './tips.types';

export class TipsRepository {
  /**
   * Get all tips for a specific home, sorted by generation date descending
   */
  async getTipsByHome(homeId: string): Promise<TipModel[]> {
    const tips = await prisma.tip.findMany({
      where: { homeId },
      orderBy: { generatedAt: 'desc' },
    });
    return tips as TipModel[];
  }

  /**
   * Get the most recent tip generation timestamp for a home
   * Used for interval gating in orchestrator
   */
  async getLastTipGenerationTime(homeId: string): Promise<Date | null> {
    const tip = await prisma.tip.findFirst({
      where: { homeId },
      orderBy: { generatedAt: 'desc' },
      select: { generatedAt: true },
    });
    return tip?.generatedAt || null;
  }

  /**
   * Create a single tip
   */
  async createTip(data: CreateTipInput): Promise<TipModel> {
    return (await prisma.tip.create({
      data: {
        homeId: data.homeId,
        imageUrls: data.imageUrls ?? [],
        title: data.title,
        description: data.description,
        categoryTag: data.categoryTag,
        estimatedSavings: data.estimatedSavings,
        sourceDeviceId: data.sourceDeviceId,
        metadata: data.metadata || {},
        generatedAt: new Date(),
      },
    })) as TipModel;
  }

  /**
   * Create multiple tips in batch
   */
  async createTipsBatch(tips: CreateTipInput[]): Promise<TipModel[]> {
    const created = await prisma.tip.createMany({
      data: tips.map(t => ({
        homeId: t.homeId,
        imageUrls: t.imageUrls ?? [],
        title: t.title,
        description: t.description,
        categoryTag: t.categoryTag,
        estimatedSavings: t.estimatedSavings,
        sourceDeviceId: t.sourceDeviceId,
        metadata: t.metadata || {},
        generatedAt: new Date(),
      })),
    });

    // Return newly created tips
    return await this.getTipsByHome(tips[0]?.homeId || '');
  }

  /**
   * Delete a specific tip by ID
   */
  async deleteTip(tipId: string): Promise<TipModel> {
    return (await prisma.tip.delete({
      where: { id: tipId },
    })) as TipModel;
  }

  /**
   * Delete all tips for a home
   */
  async deleteAllTipsByHome(homeId: string): Promise<number> {
    const result = await prisma.tip.deleteMany({
      where: { homeId },
    });
    return result.count;
  }

  /**
   * Delete tips older than a certain date (for cleanup/TTL)
   */
  async deleteTipsOlderThan(beforeDate: Date): Promise<number> {
    const result = await prisma.tip.deleteMany({
      where: {
        createdAt: {
          lt: beforeDate,
        },
      },
    });
    return result.count;
  }

  /**
   * Count tips for a home
   */
  async countTipsByHome(homeId: string): Promise<number> {
    return prisma.tip.count({
      where: { homeId },
    });
  }
}
