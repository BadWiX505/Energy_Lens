/**
 * Achievements Controller
 * Express request handlers for achievements endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { AchievementsService } from './achievements.service';

export class AchievementsController {
  private service = new AchievementsService();

  /**
   * GET /api/achievements?homeId=...
   * Processes all achievement conditions and returns results.
   */
  async getAchievements(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });

      const homeId = req.query.homeId as string;
      if (!homeId) return res.status(400).json({ message: 'homeId query parameter is required' });

      const result = await this.service.processAchievements(homeId, userId);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/achievements/:id/read
   * Mark a user achievement as read (dismiss celebration).
   */
  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });

      const userAchievementId = req.params.id as string;
      await this.service.markRead(userAchievementId, userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }
}
