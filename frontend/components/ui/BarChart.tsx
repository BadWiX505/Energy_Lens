'use client';

import {
    BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, Cell,
} from 'recharts';

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

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl shadow-xl px-3 py-2 text-xs">
            <p className="text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
                    <span className="text-zinc-700 dark:text-zinc-300">{p.name || p.dataKey}</span>
                    <span className="text-white font-bold ml-auto pl-3">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
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
    return (
        <ResponsiveContainer width="100%" height={height}>
            <ReBarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey={xKey} tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                {dataKeys.length > 1 && (
                    <Legend wrapperStyle={{ fontSize: '11px', color: '#a1a1aa', paddingTop: '8px' }} />
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
