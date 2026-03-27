'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
    title: string;
    value: string | number;
    unit: string;
    icon: string;
    color?: 'violet' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'sky';
    change?: number;       // % change (+ positive / - negative)
    subtitle?: string;
    loading?: boolean;
    className?: string;
}

const colorMap = {
    violet: { bg: 'from-violet-500/15 to-violet-500/5', icon: 'bg-violet-500/15 text-violet-400', border: 'border-violet-500/20', text: 'text-violet-400' },
    cyan: { bg: 'from-cyan-500/15 to-cyan-500/5', icon: 'bg-cyan-500/15 text-cyan-400', border: 'border-cyan-500/20', text: 'text-cyan-400' },
    amber: { bg: 'from-amber-500/15 to-amber-500/5', icon: 'bg-amber-500/15 text-amber-400', border: 'border-amber-500/20', text: 'text-amber-400' },
    emerald: { bg: 'from-emerald-500/15 to-emerald-500/5', icon: 'bg-emerald-500/15 text-emerald-400', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    rose: { bg: 'from-rose-500/15 to-rose-500/5', icon: 'bg-rose-500/15 text-rose-400', border: 'border-rose-500/20', text: 'text-rose-400' },
    sky: { bg: 'from-sky-500/15 to-sky-500/5', icon: 'bg-sky-500/15 text-sky-400', border: 'border-sky-500/20', text: 'text-sky-400' },
};

export function MetricCard({
    title,
    value,
    unit,
    icon,
    color = 'violet',
    change,
    subtitle,
    loading = false,
    className,
}: MetricCardProps) {
    const c = colorMap[color];
    const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[icon] || LucideIcons.Activity;

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5',
                'dark:bg-zinc-900/80 bg-white border-zinc-200 dark:border-white/5',
                c.bg,
                'transition-all duration-300 hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20',
                className
            )}
        >
            {/* Glowing orb in corner */}
            <div className={cn('absolute -top-4 -right-4 w-20 h-20 rounded-full blur-2xl opacity-30', c.icon)} />

            <div className="relative z-10 flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-500 dark:text-zinc-400 mb-2 uppercase tracking-wider">{title}</p>
                    {loading ? (
                        <div className="h-7 w-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
                    ) : (
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 tabular-nums">
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </span>
                            <span className={cn('text-xs font-semibold', c.text)}>{unit}</span>
                        </div>
                    )}
                    {subtitle && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">{subtitle}</p>}
                    {typeof change === 'number' && (
                        <div className={cn(
                            'inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold',
                            change > 0
                                ? 'bg-rose-500/10 text-rose-400'
                                : change < 0
                                    ? 'bg-emerald-500/10 text-emerald-400'
                                    : 'bg-zinc-500/10 text-zinc-500 dark:text-zinc-400'
                        )}>
                            {change > 0 ? <TrendingUp className="w-3 h-3" /> : change < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                            {Math.abs(change)}% vs avg
                        </div>
                    )}
                </div>
                <div className={cn('flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center', c.icon)}>
                    <IconComponent className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}
