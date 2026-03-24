'use client';

import { cn, calcProgress } from '@/lib/utils';

interface ProgressBarProps {
    value: number;      // current
    max: number;        // target
    label?: string;
    showLabel?: boolean;
    color?: 'violet' | 'emerald' | 'amber' | 'rose' | 'cyan';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    lowerIsBetter?: boolean;
    showValue?: boolean;
}

const colorMap = {
    violet: { bar: 'bg-violet-500', shadow: 'shadow-violet-500/30' },
    emerald: { bar: 'bg-emerald-500', shadow: 'shadow-emerald-500/30' },
    amber: { bar: 'bg-amber-500', shadow: 'shadow-amber-500/30' },
    rose: { bar: 'bg-rose-500', shadow: 'shadow-rose-500/30' },
    cyan: { bar: 'bg-cyan-500', shadow: 'shadow-cyan-500/30' },
};

const sizeMap = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
};

function getAutoColor(pct: number, lowerIsBetter: boolean) {
    if (lowerIsBetter) {
        if (pct >= 90) return 'rose';
        if (pct >= 70) return 'amber';
        return 'emerald';
    } else {
        if (pct >= 90) return 'emerald';
        if (pct >= 50) return 'amber';
        return 'rose';
    }
}

export function ProgressBar({
    value,
    max,
    label,
    showLabel = true,
    color,
    size = 'md',
    className,
    lowerIsBetter = true,
    showValue = true,
}: ProgressBarProps) {
    const pct = calcProgress(value, max);
    const resolvedColor = color ?? (getAutoColor(pct, lowerIsBetter) as typeof color);
    const c = colorMap[resolvedColor!];

    return (
        <div className={cn('w-full', className)}>
            {(showLabel || showValue) && (
                <div className="flex items-center justify-between mb-1.5">
                    {label && <span className="text-xs text-zinc-400">{label}</span>}
                    {showValue && (
                        <span className="text-xs font-semibold text-zinc-200 tabular-nums">
                            {value.toLocaleString()} / {max.toLocaleString()}
                        </span>
                    )}
                </div>
            )}
            <div className={cn('w-full bg-zinc-800 rounded-full overflow-hidden', sizeMap[size])}>
                <div
                    className={cn('h-full rounded-full shadow-sm transition-all duration-700 ease-out', c.bar, c.shadow)}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <div className="mt-1 text-right">
                <span className="text-[10px] text-zinc-500">{pct.toFixed(0)}%</span>
            </div>
        </div>
    );
}
