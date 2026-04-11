import { queryRows } from '../../common/influx/influx.handler';
import { NILMEngine, PowerEvent, DetectedUsage } from '../../common/nilm/nilm';
import { APPLIANCES } from '../../common/nilm/appliances';
import { ApplianceInsightsDto } from './insights.types';
import { randomUUID } from 'crypto';
import { prisma } from '../../common/config/prisma';

const POWER_CHANGE_MEASUREMENT = process.env.INFLUX_POWER_CHANGE_MEASUREMENT || "power_change_v2";
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatApplianceName(name: string): string {
    return name.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export class InsightsService {
    private async validateDeviceOwnership(deviceId: string, userId: string): Promise<boolean> {
        const device = await prisma.device.findFirst({
            where: { id: deviceId },
            include: { home: true },
        });
        if (!device || !device.home) return false;
        return device.home.userId === userId;
    }

    async getGroupedInsights(deviceId: string, userId: string): Promise<ApplianceInsightsDto[]> {
        if (!UUID_REGEX.test(deviceId)) {
            throw new Error('Invalid deviceId');
        }

        if (!(await this.validateDeviceOwnership(deviceId, userId))) {
            throw new Error('Device not found or access denied');
        }

        // Query last 24 hours of power changes for the given device
        const sql = `
            SELECT * FROM "${POWER_CHANGE_MEASUREMENT}" 
            WHERE time >= now() - INTERVAL '24h' 
            AND "device_id" = '${deviceId}'
            ORDER BY time ASC
        `;
        
        const rows = await queryRows(sql);
        
        // Map to PowerEvent[]
        const events: PowerEvent[] = rows.map(row => ({
            timestamp: new Date(row.time).toISOString(),
            deltaPower: Number(row.deltaPower),
            type: row.type as "ON" | "OFF"
        }));

        console.log('before ENgine ------------');
        // Process with NILMEngine
        const engine = new NILMEngine();
        const usages: DetectedUsage[] = engine.process(events);
        console.log('after ENgine ------------');

        // Group by appliance
        const grouped = new Map<string, { totalKwh: number, totalSeconds: number }>();
        let totalEnergyAll = 0;
        console.log('before Usage loop ------------');
        for (const usage of usages) {
            const current = grouped.get(usage.appliance) || { totalKwh: 0, totalSeconds: 0 };
            current.totalKwh += usage.energyKWh || 0;
            current.totalSeconds += usage.durationSec || 0;
            grouped.set(usage.appliance, current);
            totalEnergyAll += usage.energyKWh || 0;
        }
        console.log('after Usage loop ------------');

        // Map to ApplianceInsightsDto
        const results: ApplianceInsightsDto[] = [];
        console.log('before Mapping loop ------------');
        for (const [name, data] of grouped.entries()) {
            const profile = APPLIANCES.find(a => a.name === name);
            if (!profile) continue;

            const percentage = totalEnergyAll > 0 
                ? Math.round((data.totalKwh / totalEnergyAll) * 100) 
                : 0;
            
            const dailyKwh = Number(data.totalKwh.toFixed(2));
            const dailyHours = Number((data.totalSeconds / 3600).toFixed(1));

            results.push({
                id: randomUUID(),
                name: formatApplianceName(profile.name),
                icon: profile.icon,
                color: profile.color,
                percentage,
                dailyKwh,
                dailyHours
            });
        }
        console.log('after Mapping loop ------------');

        // Sort by dailyKwh descending
        results.sort((a, b) => b.dailyKwh - a.dailyKwh);
        console.log('just before return ------------');
        return results;
    }
}

export const insightsService = new InsightsService();
