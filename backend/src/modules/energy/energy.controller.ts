/**
 * Energy Controller
 * Express request handlers for device-centric energy data endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { EnergyService } from './energy.service';
import type { HistoryMode } from './energy.types';

const VALID_MODES: HistoryMode[] = ['hours', 'days', 'weeks', 'months'];

export class EnergyController {
  private energyService = new EnergyService();

  /**
   * GET /api/energy/history?deviceId=&mode=hours|days|weeks|months
   */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const deviceId = req.query.deviceId as string;
      const mode = req.query.mode as string;

      if (!deviceId) {
        return res.status(400).json({ message: 'deviceId query parameter is required' });
      }
      if (!mode || !VALID_MODES.includes(mode as HistoryMode)) {
        return res.status(400).json({
          message: `mode must be one of: ${VALID_MODES.join(', ')}`,
        });
      }

      const data = await this.energyService.getHistory(
        deviceId,
        userId,
        mode as HistoryMode
      );

      return res.status(200).json({
        deviceId,
        mode,
        data,
        count: data.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/energy/summary?deviceId=
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const deviceId = req.query.deviceId as string;
      if (!deviceId) {
        return res.status(400).json({ message: 'deviceId query parameter is required' });
      }

      const summary = await this.energyService.getSummary(deviceId, userId);
      return res.status(200).json(summary);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/energy/comparison?deviceId=
   */
  async getComparison(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const deviceId = req.query.deviceId as string;
      if (!deviceId) {
        return res.status(400).json({ message: 'deviceId query parameter is required' });
      }

      const data = await this.energyService.getComparison(deviceId, userId);
      return res.status(200).json({ deviceId, data });
    } catch (error) {
      next(error);
    }
  }

}
