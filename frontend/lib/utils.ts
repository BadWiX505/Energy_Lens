// ============================================================
// Utility helpers
// ============================================================

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge TailwindCSS classes safely */
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Format a number with thousand separators */
export function formatNumber(value: number, decimals = 1): string {
    return value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/** Format power in W or kW */
export function formatPower(watts: number): string {
    if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`;
    return `${watts.toFixed(1)} W`;
}

/** Format a currency value */
export function formatCurrency(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
    }).format(value);
}

/** Relative time label (e.g. "2 min ago") */
export function timeAgo(isoString: string): string {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

/** Calculate progress percentage (0-100) */
export function calcProgress(current: number, target: number): number {
    if (target <= 0) return 0;
    return clamp((current / target) * 100, 0, 100);
}

/** Get color based on progress & whether lower is better */
export function progressColor(pct: number, lowerIsBetter = true): string {
    if (lowerIsBetter) {
        if (pct >= 90) return 'text-red-500';
        if (pct >= 70) return 'text-amber-500';
        return 'text-emerald-500';
    } else {
        if (pct >= 90) return 'text-emerald-500';
        if (pct >= 50) return 'text-amber-500';
        return 'text-red-500';
    }
}

/** Severity → color map */
export const severityColors = {
    info: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-400' },
    warning: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' },
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' },
} as const;
