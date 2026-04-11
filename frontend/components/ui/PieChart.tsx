'use client';

import { useTheme } from 'next-themes';
import {
    PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { getChartColors } from '@/lib/utils';

interface PieEntry {
    name: string;
    value: number;
    color: string;
}

interface EnergyPieChartProps {
    data: PieEntry[];
    height?: number;
    innerRadius?: number;
    outerRadius?: number;
}

const CustomTooltip = ({ active, payload, chartColors }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    const isDark = chartColors?.isDark ?? true;
    return (
        <div style={{
            backgroundColor: chartColors?.tooltipBg || (isDark ? '#18212f' : '#ffffff'),
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            color: chartColors?.tooltipText || (isDark ? '#f1f5f9' : '#000000'),
        }} className="border rounded-xl shadow-xl px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: p.payload.color }} />
                <span>{p.name}</span>
                <span className="font-bold ml-2">{p.value}%</span>
            </div>
        </div>
    );
};

const CustomLegend = ({ payload, chartColors }: any) => {
    const isDark = chartColors?.isDark ?? true;
    return (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-3">
            {payload.map((entry: any) => (
                <div key={entry.value} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                    <span style={{ color: chartColors?.textColor || (isDark ? '#a1a1aa' : '#6b7280') }} className="text-[11px]">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

export function EnergyPieChart({
    data,
    height = 280,
    innerRadius = 55,
    outerRadius = 90,
}: EnergyPieChartProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const chartColors = getChartColors(isDark ? 'dark' : 'light');
    
    return (
        <ResponsiveContainer width="100%" height={height}>
            <RePieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="45%"
                    innerRadius={innerRadius}
                    outerRadius={outerRadius}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="none"
                >
                    {data.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip chartColors={{ ...chartColors, isDark }} />} />
                <Legend content={<CustomLegend chartColors={{ ...chartColors, isDark }} />} />
            </RePieChart>
        </ResponsiveContainer>
    );
}
