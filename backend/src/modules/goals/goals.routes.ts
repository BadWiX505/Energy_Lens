/**
 * Goals Routes
 * All routes require JWT authentication (applied globally in routes.ts).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { GoalsController } from './goals.controller';

const router = Router();
const controller = new GoalsController();

/** GET /api/goals?homeId= — process and return goals with live progress */
router.get('/', (req: Request, res: Response, next: NextFunction) =>
  controller.getGoals(req, res, next)
);

/** POST /api/goals — create or upsert a goal */
router.post('/', (req: Request, res: Response, next: NextFunction) =>
  controller.createGoal(req, res, next)
);

/** DELETE /api/goals/:id — remove a goal */
router.delete('/:id', (req: Request, res: Response, next: NextFunction) =>
  controller.deleteGoal(req, res, next)
);

/** PATCH /api/goals/scores/:id/read — mark a score entry as read */
router.patch('/scores/:id/read', (req: Request, res: Response, next: NextFunction) =>
  controller.markScoreRead(req, res, next)
);

export default router;
