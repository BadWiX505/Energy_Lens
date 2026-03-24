// ============================================================
// Mock Data Generators
// Replace with real API responses when backend is ready
// ============================================================

import { format, subHours, subDays, subWeeks, subMonths } from 'date-fns';
import type {
    EnergyMetrics,
    EnergyHistoryPoint,
    Alert,
    Appliance,
    Goal,
    Achievement,
    UserSettings,
    Home,
    ComparisonData,
    EnergyBreakdown,
} from '@/types';

// ── Helpers ─────────────────────────────────────────────────

export function randBetween(min: number, max: number, decimals = 1): number {
    const val = Math.random() * (max - min) + min;
    return parseFloat(val.toFixed(decimals));
}

function uid(): string {
    return Math.random().toString(36).slice(2, 9);
}

// ── Real-time metrics ────────────────────────────────────────

export function generateLiveMetrics(prev?: EnergyMetrics): EnergyMetrics {
    const power = prev
        ? Math.max(50, Math.min(3500, prev.power + randBetween(-80, 80)))
        : randBetween(800, 2200);
    const voltage = randBetween(218, 242);
    const current = parseFloat((power / voltage).toFixed(2));
    const energy = prev ? parseFloat((prev.energy + power / 3600000).toFixed(4)) : randBetween(2, 10);
    const pricePerKwh = 0.15;
    const cost = parseFloat((energy * pricePerKwh).toFixed(4));

    return {
        power: parseFloat(power.toFixed(1)),
        voltage,
        current,
        energy,
        cost,
        frequency: randBetween(49.8, 50.2),
        powerFactor: randBetween(0.88, 0.99),
        timestamp: new Date().toISOString(),
    };
}

// ── History ──────────────────────────────────────────────────

export function generateHourlyHistory(hours = 24): EnergyHistoryPoint[] {
    const now = new Date();
    return Array.from({ length: hours }, (_, i) => {
        const t = subHours(now, hours - 1 - i);
        const power = randBetween(400, 2800);
        const voltage = randBetween(218, 242);
        const current = parseFloat((power / voltage).toFixed(2));
        const energy = parseFloat((power / 1000).toFixed(3));
        return {
            power,
            voltage,
            current,
            energy,
            cost: parseFloat((energy * 0.15).toFixed(3)),
            timestamp: t.toISOString(),
            label: format(t, 'HH:mm'),
        };
    });
}

export function generateDailyHistory(days = 30): EnergyHistoryPoint[] {
    const now = new Date();
    return Array.from({ length: days }, (_, i) => {
        const t = subDays(now, days - 1 - i);
        const energy = randBetween(8, 28);
        return {
            power: randBetween(400, 2800),
            voltage: randBetween(218, 242),
            current: randBetween(2, 12),
            energy,
            cost: parseFloat((energy * 0.15).toFixed(2)),
            timestamp: t.toISOString(),
            label: format(t, 'dd MMM'),
        };
    });
}

export function generateWeeklyHistory(weeks = 12): EnergyHistoryPoint[] {
    const now = new Date();
    return Array.from({ length: weeks }, (_, i) => {
        const t = subWeeks(now, weeks - 1 - i);
        const energy = randBetween(60, 200);
        return {
            power: randBetween(600, 2500),
            voltage: randBetween(218, 242),
            current: randBetween(3, 11),
            energy,
            cost: parseFloat((energy * 0.15).toFixed(2)),
            timestamp: t.toISOString(),
            label: `W${i + 1}`,
        };
    });
}

export function generateMonthlyHistory(months = 12): EnergyHistoryPoint[] {
    const now = new Date();
    return Array.from({ length: months }, (_, i) => {
        const t = subMonths(now, months - 1 - i);
        const energy = randBetween(280, 850);
        return {
            power: randBetween(600, 2500),
            voltage: randBetween(218, 242),
            current: randBetween(3, 11),
            energy,
            cost: parseFloat((energy * 0.15).toFixed(2)),
            timestamp: t.toISOString(),
            label: format(t, 'MMM yy'),
        };
    });
}

// ── Comparison ───────────────────────────────────────────────

export function generateComparisonData(): ComparisonData[] {
    const hours = [6, 9, 12, 15, 18, 21];
    return hours.map((h) => ({
        label: `${h}:00`,
        today: randBetween(0.5, 3.5),
        yesterday: randBetween(0.5, 3.5),
    }));
}

// ── Breakdown ────────────────────────────────────────────────

export const ENERGY_BREAKDOWN: EnergyBreakdown[] = [
    { name: 'HVAC', value: 35, color: '#6366f1' },
    { name: 'Water Heater', value: 18, color: '#f59e0b' },
    { name: 'Lighting', value: 12, color: '#10b981' },
    { name: 'Kitchen', value: 15, color: '#f43f5e' },
    { name: 'Electronics', value: 10, color: '#3b82f6' },
    { name: 'Other', value: 10, color: '#94a3b8' },
];

// ── Alerts ───────────────────────────────────────────────────

export const MOCK_ALERTS: Alert[] = [
    {
        id: uid(),
        type: 'high_consumption',
        severity: 'critical',
        title: 'High Power Consumption',
        message: 'Power usage exceeded 3000W — 3 times above your average.',
        timestamp: subHours(new Date(), 0.5).toISOString(),
        read: false,
        value: 3200,
        unit: 'W',
    },
    {
        id: uid(),
        type: 'anomaly',
        severity: 'warning',
        title: 'Unusual Consumption Pattern',
        message: 'Detected abnormal energy spike at 02:30 AM.',
        timestamp: subHours(new Date(), 3).toISOString(),
        read: false,
        value: 2.1,
        unit: 'kWh',
    },
    {
        id: uid(),
        type: 'night_usage',
        severity: 'warning',
        title: 'High Night Usage',
        message: 'Energy consumption during night hours is 40% above threshold.',
        timestamp: subHours(new Date(), 8).toISOString(),
        read: false,
    },
    {
        id: uid(),
        type: 'goal_reached',
        severity: 'info',
        title: 'Daily Goal Achieved! 🎉',
        message: "You've stayed under your 15 kWh daily goal.",
        timestamp: subDays(new Date(), 1).toISOString(),
        read: true,
    },
    {
        id: uid(),
        type: 'voltage_spike',
        severity: 'warning',
        title: 'Voltage Spike Detected',
        message: 'Voltage peaked at 248V which may damage appliances.',
        timestamp: subDays(new Date(), 1).toISOString(),
        read: true,
        value: 248,
        unit: 'V',
    },
    {
        id: uid(),
        type: 'system',
        severity: 'info',
        title: 'Monthly Report Ready',
        message: 'Your February energy report is now available.',
        timestamp: subDays(new Date(), 2).toISOString(),
        read: true,
    },
];

export function generateRandomAlert(): Alert {
    const types: Alert['type'][] = ['high_consumption', 'anomaly', 'night_usage', 'voltage_spike'];
    const type = types[Math.floor(Math.random() * types.length)];
    const templates = {
        high_consumption: {
            severity: 'critical' as const,
            title: 'High Power Consumption',
            message: `Power usage spiked to ${randBetween(2800, 3800, 0)}W.`,
        },
        anomaly: {
            severity: 'warning' as const,
            title: 'Anomaly Detected',
            message: 'Unusual consumption pattern identified.',
        },
        night_usage: {
            severity: 'warning' as const,
            title: 'Night Usage Alert',
            message: 'Energy usage above night threshold.',
        },
        voltage_spike: {
            severity: 'warning' as const,
            title: 'Voltage Fluctuation',
            message: `Voltage deviation: ${randBetween(240, 252, 1)}V detected.`,
        },
        goal_reached: {
            severity: 'info' as const,
            title: 'Goal Progress',
            message: 'You are on track to meet your energy goal.',
        },
        system: {
            severity: 'info' as const,
            title: 'System Update',
            message: 'Monitoring system updated successfully.',
        },
    };
    return {
        id: uid(),
        type,
        ...templates[type],
        timestamp: new Date().toISOString(),
        read: false,
    };
}

// ── Appliances ───────────────────────────────────────────────

export const MOCK_APPLIANCES: Appliance[] = [
    { id: '1', name: 'Air Conditioner', icon: 'Wind', watts: 1800, dailyHours: 6, dailyKwh: 10.8, percentage: 34, color: '#6366f1' },
    { id: '2', name: 'Water Heater', icon: 'Droplets', watts: 2000, dailyHours: 2.5, dailyKwh: 5.0, percentage: 16, color: '#f59e0b' },
    { id: '3', name: 'Refrigerator', icon: 'Thermometer', watts: 150, dailyHours: 24, dailyKwh: 3.6, percentage: 11, color: '#10b981' },
    { id: '4', name: 'Washing Machine', icon: 'Shirt', watts: 500, dailyHours: 1.5, dailyKwh: 0.75, percentage: 6, color: '#f43f5e' },
    { id: '5', name: 'Oven / Cooker', icon: 'Flame', watts: 2200, dailyHours: 1, dailyKwh: 2.2, percentage: 8, color: '#fb923c' },
    { id: '6', name: 'TV & Electronics', icon: 'Monitor', watts: 120, dailyHours: 5, dailyKwh: 0.6, percentage: 4, color: '#3b82f6' },
    { id: '7', name: 'Lighting', icon: 'Lightbulb', watts: 200, dailyHours: 8, dailyKwh: 1.6, percentage: 8, color: '#facc15' },
    { id: '8', name: 'Other Loads', icon: 'Plug', watts: 300, dailyHours: 4, dailyKwh: 1.2, percentage: 13, color: '#94a3b8' },
];

// ── Goals ────────────────────────────────────────────────────

export const MOCK_GOALS: Goal[] = [
    {
        id: '1',
        metric: 'energy',
        period: 'daily',
        target: 15,
        current: 11.3,
        unit: 'kWh',
        label: 'Daily Energy Limit',
        createdAt: subDays(new Date(), 7).toISOString(),
    },
    {
        id: '2',
        metric: 'cost',
        period: 'monthly',
        target: 80,
        current: 54.2,
        unit: 'USD',
        label: 'Monthly Budget',
        createdAt: subDays(new Date(), 15).toISOString(),
    },
    {
        id: '3',
        metric: 'power',
        period: 'daily',
        target: 2000,
        current: 1650,
        unit: 'W',
        label: 'Peak Power Limit',
        createdAt: subDays(new Date(), 3).toISOString(),
    },
];

// ── Achievements ─────────────────────────────────────────────

export const MOCK_ACHIEVEMENTS: Achievement[] = [
    { id: '1', name: 'Energy Saver', description: 'Stay under daily goal for 3 days', icon: 'Leaf', unlocked: true, unlockedAt: subDays(new Date(), 2).toISOString(), xp: 100 },
    { id: '2', name: 'Night Owl Tamer', description: 'No night alerts for a week', icon: 'Moon', unlocked: true, unlockedAt: subDays(new Date(), 5).toISOString(), xp: 150 },
    { id: '3', name: 'Power Master', description: 'Reduce peak power by 20%', icon: 'Zap', unlocked: false, progress: 65, xp: 200 },
    { id: '4', name: 'Budget Guardian', description: 'Hit monthly budget goal', icon: 'Shield', unlocked: false, progress: 68, xp: 250 },
    { id: '5', name: 'Green Champion', description: 'Achieve efficiency score > 90', icon: 'Award', unlocked: false, progress: 80, xp: 300 },
    { id: '6', name: 'Streak 30', description: 'Meet daily goal 30 days in a row', icon: 'Flame', unlocked: false, progress: 30, xp: 500 },
];

// ── Settings ─────────────────────────────────────────────────

export const DEFAULT_SETTINGS: UserSettings = {
    max_power_threshold: 3000,
    night_threshold: 500,
    price_per_kwh: 0.15,
    currency: 'USD',
    billing_start: 1,
    enable_notifications: true,
    created_at: subDays(new Date(), 30).toISOString(),
};

// ── Homes ────────────────────────────────────────────────────

export const MOCK_HOMES: Home[] = [
    { id: 'h1', name: 'Main Residence', location: 'Algiers, Algeria', timezone: 'Africa/Algiers' },
    { id: 'h2', name: 'Summer House', location: 'Tizi Ouzou, Algeria', timezone: 'Africa/Algiers' },
];

// ── Bill Prediction ──────────────────────────────────────────

export function predictMonthlyBill(pricePerKwh: number): {
    projected: number;
    daysLeft: number;
    avgDaily: number;
    lastMonth: number;
} {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = daysInMonth - dayOfMonth;
    const avgDaily = randBetween(12, 20);
    const projected = parseFloat((avgDaily * daysInMonth * pricePerKwh).toFixed(2));
    const lastMonth = parseFloat((randBetween(55, 95)).toFixed(2));
    return { projected, daysLeft, avgDaily, lastMonth };
}

// ── Energy Tips ──────────────────────────────────────────────

export interface EnergyTip {
    id: string;
    category: string;
    icon: string;
    title: string;
    description: string;
    savingsEst: string;
}

export const ENERGY_TIPS: EnergyTip[] = [
    { id: 't1', category: 'HVAC', icon: 'Thermometer', title: 'Optimize AC Temperature', description: 'Set your AC to 24°C instead of 20°C. Each degree saves ~6% on cooling costs.', savingsEst: '~15% savings' },
    { id: 't2', category: 'Standby', icon: 'Power', title: 'Kill Standby Power', description: 'Unplug devices when not in use. Standby power can account for 10% of your bill.', savingsEst: '~10% savings' },
    { id: 't3', category: 'Lighting', icon: 'Lightbulb', title: 'Switch to LED Bulbs', description: 'LED bulbs use 75% less energy than traditional incandescent.', savingsEst: '~8% savings' },
    { id: 't4', category: 'Laundry', icon: 'Shirt', title: 'Wash with Cold Water', description: 'Cold water cycles use 90% less energy than hot water cycles.', savingsEst: '~5% savings' },
    { id: 't5', category: 'Timing', icon: 'Clock', title: 'Use Off-Peak Hours', description: 'Run heavy appliances (dishwasher, washer) after 10 PM when electricity rates are lower.', savingsEst: '~12% savings' },
    { id: 't6', category: 'Refrigerator', icon: 'Snowflake', title: 'Fridge Temperature', description: 'Set refrigerator to 3–5°C and freezer to -18°C for optimal efficiency.', savingsEst: '~3% savings' },
    { id: 't7', category: 'Solar', icon: 'Sun', title: 'Consider Solar Panels', description: 'Solar panels can offset 50–90% of your electricity bill depending on sun exposure.', savingsEst: 'up to 90%' },
    { id: 't8', category: 'Behaviour', icon: 'User', title: 'Short Showers Save', description: 'Reducing shower time by 2 minutes cuts water heating energy significantly.', savingsEst: '~4% savings' },
];
