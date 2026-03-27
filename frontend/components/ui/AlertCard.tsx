'use client';

import { cn, timeAgo, severityColors } from '@/lib/utils';
import { AlertTriangle, Info, Zap, Moon, TrendingUp, CheckCircle2, Bell } from 'lucide-react';
import type { Alert } from '@/types';

interface AlertCardProps {
    alert: Alert;
    onRead?: (id: string) => void;
    className?: string;
}

const typeIcons: Record<Alert['type'], React.ComponentType<{ className?: string }>> = {
    high_consumption: TrendingUp,
    anomaly: AlertTriangle,
    night_usage: Moon,
    goal_reached: CheckCircle2,
    voltage_spike: Zap,
    system: Bell,
};

export function AlertCard({ alert, onRead, className }: AlertCardProps) {
    const c = severityColors[alert.severity];
    const Icon = typeIcons[alert.type] || Info;

    return (
        <div
            className={cn(
                'group flex items-start gap-4 p-4 rounded-xl border transition-all duration-200',
                c.bg, c.border,
                !alert.read && 'ring-1 ring-inset ring-white/5',
                'hover:border-white/15 hover:shadow-md hover:shadow-black/20',
                className
            )}
        >
            {/* Icon */}
            <div className={cn('flex-shrink-0 mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center', c.bg, c.border, 'border')}>
                <Icon className={cn('w-4 h-4', c.text)} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            {!alert.read && <span className={cn('flex-shrink-0 w-1.5 h-1.5 rounded-full', c.dot)} />}
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{alert.title}</p>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{alert.message}</p>
                        {alert.value != null && (
                            <p className={cn('text-xs font-bold mt-1', c.text)}>
                                {alert.value} {alert.unit}
                            </p>
                        )}
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{timeAgo(alert.timestamp)}</span>
                        <span className={cn(
                            'text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize',
                            c.bg, c.text, 'border', c.border
                        )}>
                            {alert.severity}
                        </span>
                    </div>
                </div>
                {!alert.read && onRead && (
                    <button
                        onClick={() => onRead(alert.id)}
                        className="mt-2 text-[10px] text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition-colors underline underline-offset-2"
                    >
                        Mark as read
                    </button>
                )}
            </div>
        </div>
    );
}
