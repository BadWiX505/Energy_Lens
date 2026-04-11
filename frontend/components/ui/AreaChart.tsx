'use client';

import { useTheme } from 'next-themes';
import {
    AreaChart as ReAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend,
} from 'recharts';
import { cn, getChartColors } from '@/lib/utils';

interface DataKey {
    key: string;
    color: string;
    label?: string;
}

interface EnergyAreaChartProps {
    data: Record<string, unknown>[];
    dataKeys: DataKey[];
    height?: number;
    xKey?: string;
    className?: string;
    gradient?: boolean;
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
                    <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                    <span className="font-medium">{p.name || p.dataKey}</span>
                    <span className="font-bold ml-auto pl-3">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
                </div>
            ))}
        </div>
    );
};

export function EnergyAreaChart({
    data,
    dataKeys,
    height = 240,
    xKey = 'label',
    gradient = true,
}: EnergyAreaChartProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const chartColors = getChartColors(isDark ? 'dark' : 'light');
    
    return (
        <ResponsiveContainer width="100%" height={height}>
            <ReAreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                <defs>
                    {dataKeys.map(({ key, color }) => (
                        <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} vertical={false} />
                <XAxis
                    dataKey={xKey}
                    tick={{ fill: chartColors.textColor, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                />
                <YAxis
                    tick={{ fill: chartColors.textColor, fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                />
                <Tooltip content={<CustomTooltip chartColors={{ ...chartColors, isDark }} />} />
                {dataKeys.length > 1 && (
                    <Legend
                        wrapperStyle={{ fontSize: '11px', color: chartColors.textColor, paddingTop: '8px' }}
                    />
                )}
                {dataKeys.map(({ key, color, label }) => (
                    <Area
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={label || key}
                        stroke={color}
                        strokeWidth={2}
                        fill={gradient ? `url(#grad-${key})` : 'transparent'}
                        dot={false}
                        activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                ))}
            </ReAreaChart>
        </ResponsiveContainer>
    );
}
