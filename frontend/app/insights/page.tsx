'use client';

import { useEffect, useState } from 'react';
import { getInsights } from '@/lib/api';
import { useEnergyStore } from '@/store/energyStore';
import type { Appliance } from '@/types';
import * as LucideIcons from 'lucide-react';
import { Cpu, Leaf, Loader2, MonitorSpeaker, type LucideIcon } from 'lucide-react';
import { ChartCard } from '@/components/ui/ChartCard';
import { EnergyPieChart } from '@/components/ui/PieChart';
import { cn, formatNumber } from '@/lib/utils';

export default function InsightsPage() {
    const selectedDeviceId = useEnergyStore((s) => s.selectedDeviceId);
    const [appliances, setAppliances] = useState<Appliance[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!selectedDeviceId) {
            setAppliances([]);
            return;
        }
        setLoading(true);
        getInsights(selectedDeviceId).then(setAppliances).finally(() => setLoading(false));
    }, [selectedDeviceId]);

    if (!selectedDeviceId) {
        return (
            <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3 text-center">
                <MonitorSpeaker className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Select a device to view appliance insights</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        );
    }

    const totalKwh = appliances.reduce((s, a) => s + a.dailyKwh, 0);

    const pieData = appliances.map((a) => ({
        name: a.name,
        value: a.percentage,
        color: a.color,
    }));

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-violet-400" />
                    Appliance Insights
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">(NILM) — Detected appliances and estimated consumption</p>
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Devices Detected', value: appliances.length, unit: '' },
                    { label: 'Daily Total', value: totalKwh.toFixed(1), unit: 'kWh' },
                    { label: 'Est. Monthly', value: (totalKwh * 30).toFixed(0), unit: 'kWh' },
                ].map((s) => (
                    <div key={s.label} className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900/80 p-4">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{s.label}</p>
                        <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{s.value} <span className="text-sm text-zinc-500 dark:text-zinc-400">{s.unit}</span></p>
                    </div>
                ))}
            </div>

            {/* Appliances + Pie */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Appliance cards grid */}
                <div className="xl:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {appliances.map((appliance) => {
                            const Icon = (LucideIcons as unknown as Record<string, LucideIcon>)[appliance.icon] || LucideIcons.Plug;
                            return (
                                <div
                                    key={appliance.id}
                                    className="group rounded-2xl border border-black/5 dark:border-white/5 bg-white p-4 hover:border-black/10 dark:border-white/10  dark:bg-zinc-900 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: appliance.color + '22', color: appliance.color }}
                                            >
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{appliance.name}</p>
                                            </div>
                                        </div>
                                        <span
                                            className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                                            style={{ backgroundColor: appliance.color + '22', color: appliance.color }}
                                        >
                                            {appliance.percentage}%
                                        </span>
                                    </div>

                                    {/* Stats row */}
                                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-black/5 dark:border-white/5">
                                        {[
                                            { label: 'Today Use', value: `${appliance.dailyHours}h` },
                                            { label: 'Today kWh', value: `${appliance.dailyKwh}` },
                                            { label: 'Monthly', value: `${(appliance.dailyKwh * 30).toFixed(0)} kWh` },
                                        ].map((s) => (
                                            <div key={s.label} className="text-center">
                                                <p className="text-[9px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{s.label}</p>
                                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Mini bar */}
                                    <div className="mt-3 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-700"
                                            style={{ width: `${appliance.percentage}%`, backgroundColor: appliance.color }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Pie chart */}
                <div>
                    <ChartCard title="Consumption Share" subtitle="By appliance category">
                        <EnergyPieChart data={pieData} height={320} />
                    </ChartCard>
                    <div className="mt-3 rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                        <div className="flex gap-2">
                            <Leaf className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-semibold text-emerald-300">Biggest Saving Opportunity</p>
                                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                                    Reducing <strong className="text-zinc-800 dark:text-zinc-200">HVAC usage by 1 hour/day</strong> could save ~<strong className="text-emerald-300">$8.10/month</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
