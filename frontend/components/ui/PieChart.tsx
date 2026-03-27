'use client';

import {
    PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

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

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const p = payload[0];
    return (
        <div className="bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-xl shadow-xl px-3 py-2 text-xs">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: p.payload.color }} />
                <span className="text-zinc-700 dark:text-zinc-300">{p.name}</span>
                <span className="text-white font-bold ml-2">{p.value}%</span>
            </div>
        </div>
    );
};

const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 pt-3">
        {payload.map((entry: any) => (
            <div key={entry.value} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: entry.color }} />
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{entry.value}</span>
            </div>
        ))}
    </div>
);

export function EnergyPieChart({
    data,
    height = 280,
    innerRadius = 55,
    outerRadius = 90,
}: EnergyPieChartProps) {
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
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
            </RePieChart>
        </ResponsiveContainer>
    );
}
