'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChartCardProps {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
}

export function ChartCard({ title, subtitle, action, children, className, noPadding = false }: ChartCardProps) {
    return (
        <div className={cn(
            'rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/80',
            'shadow-sm',
            className
        )}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-white/5">
                <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                    {subtitle && <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{subtitle}</p>}
                </div>
                {action && <div className="flex-shrink-0">{action}</div>}
            </div>
            <div className={cn(!noPadding && 'p-4')}>{children}</div>
        </div>
    );
}
