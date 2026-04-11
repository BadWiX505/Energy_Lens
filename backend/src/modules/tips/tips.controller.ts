/**
 * Tips Controller
 * Express request handlers for tips endpoints.
 * Follows the tri-layer pattern: Repository → Service → Controller
 */

import { Request, Response, NextFunction } from 'express';
import { TipsService } from './tips.service';
import { mapTipModelToDto } from './tips.types';

export class TipsController {
  private tipsService = new TipsService();

  /**
   * GET /api/tips?homeId=...
   * Fetch all tips for a given home.
   */
  async getTips(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const homeId = req.query.homeId as string;
      if (!homeId) {
        return res.status(400).json({ message: 'homeId query parameter is required' });
      }

      const tips = await this.tipsService.getTips(homeId, userId);
      const tipDtos = tips.map(mapTipModelToDto);
      return res.status(200).json(tipDtos);
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/tips/:id
   * Delete a single tip.
   */
  async deleteTip(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const tipId = req.params.id as string;
      await this.tipsService.deleteTip(tipId, userId);

      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/tips?homeId=...
   * Delete ALL tips for a home.
   */
  async deleteAllTips(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const homeId = req.query.homeId as string;
      if (!homeId) {
        return res.status(400).json({ message: 'homeId query parameter is required' });
      }

      const count = await this.tipsService.deleteAllTips(homeId, userId);
      return res.status(200).json({ deleted: count });
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }
}
