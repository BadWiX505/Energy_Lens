/**
 * Achievements Routes
 * All routes require JWT authentication (applied globally in routes.ts).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AchievementsController } from './achievements.controller';

const router = Router();
const controller = new AchievementsController();

/** GET /api/achievements?homeId= — process and return achievements */
router.get('/', (req: Request, res: Response, next: NextFunction) =>
  controller.getAchievements(req, res, next)
);

/** PATCH /api/achievements/:id/read — mark as read */
router.patch('/:id/read', (req: Request, res: Response, next: NextFunction) =>
  controller.markRead(req, res, next)
);

export default router;
