/**
 * Tips Service
 * Business logic and ownership validation for tips.
 * Follows the tri-layer pattern: Repository → Service → Controller
 */

import { prisma } from '../../common/config/prisma';
import { TipsRepository } from './tips.repo';
import type { CreateTipInput, TipModel } from './tips.types';

export class TipsService {
  private repo = new TipsRepository();

  /**
   * Verify the authenticated user owns the given home
   */
  private async validateHomeOwnership(homeId: string, userId: string): Promise<boolean> {
    const home = await prisma.home.findFirst({
      where: { id: homeId, userId },
    });
    return !!home;
  }

  /**
   * Verify the user owns the tip (via the home)
   */
  private async validateTipOwnership(tipId: string, userId: string): Promise<boolean> {
    const tip = await prisma.tip.findFirst({
      where: {
        id: tipId,
        home: { userId },
      },
    });
    return !!tip;
  }

  /**
   * Get all tips for a specific home
   */
  async getTips(homeId: string, userId: string): Promise<TipModel[]> {
    if (!(await this.validateHomeOwnership(homeId, userId))) {
      throw new Error('Home not found or access denied');
    }
    return this.repo.getTipsByHome(homeId);
  }

  /**
   * Delete a single tip
   */
  async deleteTip(tipId: string, userId: string): Promise<TipModel> {
    if (!(await this.validateTipOwnership(tipId, userId))) {
      throw new Error('Tip not found or access denied');
    }
    return this.repo.deleteTip(tipId);
  }

  /**
   * Delete all tips for a home
   */
  async deleteAllTips(homeId: string, userId: string): Promise<number> {
    if (!(await this.validateHomeOwnership(homeId, userId))) {
      throw new Error('Home not found or access denied');
    }
    return this.repo.deleteAllTipsByHome(homeId);
  }

  /**
   * Create a single tip (internal use by tips generator)
   * Does NOT validate ownership; assumes internal call from orchestrator
   */
  async createTipInternal(data: CreateTipInput): Promise<TipModel> {
    return this.repo.createTip(data);
  }

  /**
   * Create batch of tips (internal use by tips generator)
   * Does NOT validate ownership; assumes internal call from orchestrator
   */
  async createTipsInternal(tips: CreateTipInput[]): Promise<TipModel[]> {
    if (tips.length === 0) return [];
    return this.repo.createTipsBatch(tips);
  }

  /**
   * Get last tip generation time for interval gating check
   */
  async getLastGenerationTime(homeId: string): Promise<Date | null> {
    return this.repo.getLastTipGenerationTime(homeId);
  }
}
