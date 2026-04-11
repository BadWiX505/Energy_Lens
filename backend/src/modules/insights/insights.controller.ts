import { Request, Response } from 'express';
import { insightsService } from './insights.service';

export class InsightsController {
    async getInsights(req: Request, res: Response) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ message: 'Unauthorized' });
                return;
            }

            const { deviceId } = req.query;
            if (!deviceId || typeof deviceId !== 'string') {
                res.status(400).json({ message: 'deviceId query param is required' });
                return;
            }

            const data = await insightsService.getGroupedInsights(deviceId, userId);
            res.json(data);
        } catch (error: any) {
            if (error?.message === 'Invalid deviceId' || error?.message === 'Device not found or access denied') {
                res.status(403).json({ message: error.message });
                return;
            }
            console.error('[InsightsController] Failed to get insights:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}

export const insightsController = new InsightsController();
