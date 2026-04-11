/**
 * Tips Routes
 * Endpoints for managing tips.
 *
 * All routes require JWT authentication (applied globally in routes.ts).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { TipsController } from './tips.controller';

const router = Router();
const controller = new TipsController();

/**
 * GET /api/tips?homeId=...
 * Fetch all tips for a given home.
 */
router.get('/', (req: Request, res: Response, next: NextFunction) =>
  controller.getTips(req, res, next)
);

/**
 * DELETE /api/tips?homeId=...
 * Delete ALL tips for a home.
 * Must come BEFORE the /:id route to avoid route matching conflicts.
 */
router.delete('/', (req: Request, res: Response, next: NextFunction) =>
  controller.deleteAllTips(req, res, next)
);

/**
 * DELETE /api/tips/:id
 * Delete a single tip.
 */
router.delete('/:id', (req: Request, res: Response, next: NextFunction) =>
  controller.deleteTip(req, res, next)
);

export default router;
