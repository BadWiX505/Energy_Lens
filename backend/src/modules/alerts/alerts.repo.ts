/**
 * Alerts Repository
 * Database access logic for alerts using Prisma.
 */

import { prisma } from '../../common/config/prisma';
import type { CreateAlertInput } from './alerts.types';
import { Alert } from '../../generated/prisma/client';

export class AlertsRepository {
  
  /** Get all alerts for a specific home */
  async getAlertsByHome(homeId: string): Promise<Alert[]> {
    return prisma.alert.findMany({
      where: { homeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Create a new alert */
  async createAlert(data: CreateAlertInput): Promise<Alert> {
    return prisma.alert.create({
      data: {
        homeId: data.homeId,
        type: data.type,
        ruleType: data.ruleType,
        message: data.message,
        metadata: data.metadata,
        isRead: false,
      },
    });
  }

  /** Mark a specific alert as read */
  async markAlertAsRead(alertId: string): Promise<Alert> {
    return prisma.alert.update({
      where: { id: alertId },
      data: { isRead: true },
    });
  }

  /** Delete a specific alert */
  async deleteAlert(alertId: string): Promise<Alert> {
    return prisma.alert.delete({
      where: { id: alertId },
    });
  }

  /** Delete all alerts for a home */
  async deleteAllAlertsByHome(homeId: string): Promise<number> {
    const result = await prisma.alert.deleteMany({ where: { homeId } });
    return result.count;
  }

}
