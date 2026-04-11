'use client';

import { useTheme } from 'next-themes';
import {
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { getChartColors } from '@/lib/utils';

interface BarDataKey {
    key: string;
    color: string;
    label?: string;
}

interface EnergyBarChartProps {
    data: Record<string, unknown>[];
    dataKeys: BarDataKey[];
    height?: number;
    xKey?: string;
    stacked?: boolean;
}

const CustomTooltip = ({ active, payload, label, chartColors }: any) => {
    if (!active || !payload?.length) return null;
    const isDark = chartColors?.isDark ?? true;
    return (
        <div style={{
            backgroundColor: chartColors?.tooltipBg || (isDark ? '#18212f' : '#ffffff'),
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            color: chartColors?.tooltipText || (isDark ? '#f1f5f9' : '#000000'),
        }} className="border rounded-xl shadow-xl px-3 py-2 text-xs">
            <p style={{ color: isDark ? '#a1a1aa' : '#6b7280' }} className="mb-1.5">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
                    <span>{p.name || p.dataKey}</span>
                    <span className="font-bold ml-auto pl-3">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
                </div>
            ))}
        </div>
    );
};

export function EnergyBarChart({
    data,
    dataKeys,
    height = 240,
    xKey = 'label',
    stacked = false,
}: EnergyBarChartProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const chartColors = getChartColors(isDark ? 'dark' : 'light');
    
    return (
        <ResponsiveContainer width="100%" height={height}>
            <ReBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} vertical={false} />
                <XAxis dataKey={xKey} tick={{ fill: chartColors.textColor, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: chartColors.textColor, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip chartColors={{ ...chartColors, isDark }} />} cursor={{ fill: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }} />
                {dataKeys.length > 1 && (
                    <Legend wrapperStyle={{ fontSize: '11px', color: chartColors.textColor, paddingTop: '8px' }} />
                )}
                {dataKeys.map(({ key, color, label }) => (
                    <Bar
                        key={key}
                        dataKey={key}
                        name={label || key}
                        fill={color}
                        stackId={stacked ? 'stack' : undefined}
                        radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                        maxBarSize={40}
                    />
                ))}
            </ReBarChart>
        </ResponsiveContainer>
    );
}
