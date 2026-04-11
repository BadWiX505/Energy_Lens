import { Router } from 'express';
import { insightsController } from './insights.controller';

const router = Router();

// GET /api/insights
router.get('/', (req, res) => insightsController.getInsights(req, res));

export default router;
