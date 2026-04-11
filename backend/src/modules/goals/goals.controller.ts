/**
 * Goals Controller
 * Express request handlers for goals endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { GoalsService } from './goals.service';
import type { CreateGoalInput, GoalType, GoalMetric } from './goals.types';

export class GoalsController {
  private service = new GoalsService();

  /**
   * GET /api/goals?homeId=...
   * Triggers goal processing (Influx progress calculation + score awarding).
   */
  async getGoals(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });

      const homeId = req.query.homeId as string;
      if (!homeId) return res.status(400).json({ message: 'homeId query parameter is required' });

      const result = await this.service.processGoals(homeId, userId);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * POST /api/goals
   * Body: { homeId, type, targetValue, targetMetric, label? }
   */
  async createGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });

      const { homeId, type, targetValue, targetMetric, label, duration } = req.body as CreateGoalInput;
      if (!homeId || !type || !targetMetric || targetValue == null) {
        return res.status(400).json({ message: 'homeId, type, targetValue, and targetMetric are required' });
      }

      const VALID_TYPES: GoalType[] = ['daily', 'weekly', 'monthly'];
      const VALID_METRICS: GoalMetric[] = ['energy', 'cost', 'power'];
      if (!VALID_TYPES.includes(type)) {
        return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` });
      }
      if (!VALID_METRICS.includes(targetMetric)) {
        return res.status(400).json({ message: `targetMetric must be one of: ${VALID_METRICS.join(', ')}` });
      }

      const goal = await this.service.createGoal(
        { homeId, type, targetValue: Number(targetValue), targetMetric, label, duration: Number(duration ?? 1) },
        userId
      );
      return res.status(201).json(goal);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('access denied')) {
          return res.status(403).json({ message: error.message });
        }
        if (error.message.includes('already exists')) {
          return res.status(409).json({ message: error.message });
        }
        if (error.message.includes('exceeds') || error.message.includes('must be') || error.message.includes('Duration')) {
          return res.status(422).json({ message: error.message });
        }
      }
      next(error);
    }
  }

  /**
   * DELETE /api/goals/:id
   */
  async deleteGoal(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });

      const goalId = req.params.id as string;
      await this.service.deleteGoal(goalId, userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * PATCH /api/goals/scores/:id/read
   */
  async markScoreRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: 'User not authenticated' });

      const scoreId = req.params.id as string;
      await this.service.markScoreRead(scoreId, userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }
}
