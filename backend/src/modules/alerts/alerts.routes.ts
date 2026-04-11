/**
 * Alerts Routes
 * Endpoints for managing alerts.
 *
 * All routes require JWT authentication (applied globally in routes.ts).
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AlertsController } from './alerts.controller';

const router = Router();
const controller = new AlertsController();

/**
 * GET /api/alerts?homeId=...
 * Fetch all alerts for a given home.
 */
router.get('/', (req: Request, res: Response, next: NextFunction) =>
  controller.getAlerts(req, res, next)
);

/**
 * POST /api/alerts/:id/read
 * Mark an alert as read.
 */
router.post('/:id/read', (req: Request, res: Response, next: NextFunction) =>
  controller.markAsRead(req, res, next)
);

/**
 * DELETE /api/alerts?homeId=...
 * Delete ALL alerts for a home.
 */
router.delete('/', (req: Request, res: Response, next: NextFunction) =>
  controller.deleteAllAlerts(req, res, next)
);

/**
 * DELETE /api/alerts/:id
 * Delete an alert.
 */
router.delete('/:id', (req: Request, res: Response, next: NextFunction) =>
  controller.deleteAlert(req, res, next)
);

export default router;
