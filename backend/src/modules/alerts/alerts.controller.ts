/**
 * Alerts Controller
 * Express request handlers for alerts endpoints.
 */

import { Request, Response, NextFunction } from 'express';
import { AlertsService } from './alerts.service';

export class AlertsController {
  private alertsService = new AlertsService();

  /**
   * GET /api/alerts?homeId=...
   */
  async getAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const homeId = req.query.homeId as string;
      if (!homeId) {
        return res.status(400).json({ message: 'homeId query parameter is required' });
      }

      const alerts = await this.alertsService.getAlerts(homeId, userId);
      const mappedAlerts = alerts.map(alert => ({
        id: alert.id,
        type: 'system',
        severity: alert.type === 'warnings' ? 'warning' : (alert.type || 'info'),
        title: alert.type ? alert.type.toUpperCase() + ' ALERT' : 'System Alert',
        message: alert.message || '',
        timestamp: alert.createdAt.toISOString(),
        read: alert.isRead || false,
      }));
      return res.status(200).json(mappedAlerts);
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
         return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * POST /api/alerts/:id/read
   */
  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const alertId = req.params.id as string;
      const alert = await this.alertsService.markAsRead(alertId, userId);
      
      return res.status(200).json({
        id: alert.id,
        type: 'system',
        severity: alert.type === 'warnings' ? 'warning' : (alert.type || 'info'),
        title: alert.type ? alert.type.toUpperCase() + ' ALERT' : 'System Alert',
        message: alert.message || '',
        timestamp: alert.createdAt.toISOString(),
        read: alert.isRead || false,
      });
    } catch (error) {
       if (error instanceof Error && error.message.includes('access denied')) {
         return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/alerts/:id
   */
  async deleteAlert(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const alertId = req.params.id as string;
      await this.alertsService.deleteAlert(alertId, userId);
      
      return res.status(204).send();
    } catch (error) {
       if (error instanceof Error && error.message.includes('access denied')) {
         return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }

  /**
   * DELETE /api/alerts?homeId=...
   * Delete ALL alerts for a home.
   */
  async deleteAllAlerts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: 'User not authenticated' });
      }

      const homeId = req.query.homeId as string;
      if (!homeId) {
        return res.status(400).json({ message: 'homeId query parameter is required' });
      }

      const count = await this.alertsService.deleteAllAlerts(homeId, userId);
      return res.status(200).json({ deleted: count });
    } catch (error) {
      if (error instanceof Error && error.message.includes('access denied')) {
        return res.status(403).json({ message: error.message });
      }
      next(error);
    }
  }
}
