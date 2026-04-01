import { Request, Response, NextFunction } from 'express';
import { PreferencesService } from './preferences.service';

export class PreferencesController {
  private preferencesService = new PreferencesService();

  async createPreference(req: Request, res: Response, next: NextFunction) {
    try {
      const { homeId, maxPowerThreshold, nightThreshold, pricePerKwh, currency, billingStart, enableNotifications } = req.body;
      
      if (!homeId) {
        return res.status(400).json({ message: 'Home ID is required' });
      }

      const result = await this.preferencesService.createPreference({
        homeId,
        maxPowerThreshold,
        nightThreshold,
        pricePerKwh,
        currency,
        billingStart,
        enableNotifications,
      });

      return res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPreferenceByHomeId(req: Request, res: Response, next: NextFunction) {
    try {
      const { homeId } = req.query;
      
      if (!homeId) {
        return res.status(400).json({ message: 'Home ID is required' });
      }

      const preference = await this.preferencesService.getPreferenceByHomeId({
        homeId: homeId as string,
      });

      return res.status(200).json(preference);
    } catch (error) {
      next(error);
    }
  }
}
