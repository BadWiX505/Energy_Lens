/**
 * Alerts Service
 * Business logic and ownership validation for alerts.
 */

import { prisma } from '../../common/config/prisma';
import { AlertsRepository } from './alerts.repo';
import { Alert } from '../../generated/prisma/client';

export class AlertsService {
  private repo = new AlertsRepository();

  /** Verify the authenticated user owns the given home */
  private async validateHomeOwnership(homeId: string, userId: string): Promise<boolean> {
    const home = await prisma.home.findFirst({
      where: { id: homeId, userId },
    });
    return !!home;
  }

  /** Verify the user owns the alert (via the home) */
  private async validateAlertOwnership(alertId: string, userId: string): Promise<boolean> {
    const alert = await prisma.alert.findFirst({
      where: { 
        id: alertId,
        home: { userId }
      },
    });
    return !!alert;
  }

  /**
   * Get all alerts for a specific home
   */
  async getAlerts(homeId: string, userId: string): Promise<Alert[]> {
    if (!(await this.validateHomeOwnership(homeId, userId))) {
      throw new Error('Home not found or access denied');
    }
    return this.repo.getAlertsByHome(homeId);
  }

  /**
   * Mark an alert as read
   */
  async markAsRead(alertId: string, userId: string): Promise<Alert> {
    if (!(await this.validateAlertOwnership(alertId, userId))) {
      throw new Error('Alert not found or access denied');
    }
    return this.repo.markAlertAsRead(alertId);
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: string, userId: string): Promise<Alert> {
    if (!(await this.validateAlertOwnership(alertId, userId))) {
      throw new Error('Alert not found or access denied');
    }
    return this.repo.deleteAlert(alertId);
  }

  /**
   * Delete all alerts for a home
   */
  async deleteAllAlerts(homeId: string, userId: string): Promise<number> {
    if (!(await this.validateHomeOwnership(homeId, userId))) {
      throw new Error('Home not found or access denied');
    }
    return this.repo.deleteAllAlertsByHome(homeId);
  }

}
