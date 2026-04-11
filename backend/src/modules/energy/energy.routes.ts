/**
 * Energy Routes
 * Endpoints for energy data retrieval from InfluxDB
 *
 * All routes require JWT authentication (applied globally in routes.ts).
 * All routes require a `homeId` query parameter.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { EnergyController } from './energy.controller';

const router = Router();
const controller = new EnergyController();

/**
 * GET /api/energy/history?homeId=&mode=hours|days|weeks|months&deviceId=
 * Returns grouped energy data points for charts
 */
router.get('/history', (req: Request, res: Response, next: NextFunction) =>
  controller.getHistory(req, res, next)
);

/**
 * GET /api/energy/summary?homeId=
 * Returns summary stats: today, this week, this month, last month + trend
 */
router.get('/summary', (req: Request, res: Response, next: NextFunction) =>
  controller.getSummary(req, res, next)
);

/**
 * GET /api/energy/comparison?homeId=
 * Returns today vs yesterday hourly comparison data
 */
router.get('/comparison', (req: Request, res: Response, next: NextFunction) =>
  controller.getComparison(req, res, next)
);

export default router;
