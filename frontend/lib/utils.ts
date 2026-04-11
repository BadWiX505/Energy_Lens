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
    warning: { bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
    critical: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' },
} as const;

// ============================================================
// Light/Dark Mode Color Utilities
// ============================================================

/**
 * Get severity-based color classes with light/dark mode support
 * Returns classes for background, border, text (light), text (dark), and hover states
 */
export function getAlertColorClasses(severity: 'info' | 'warning' | 'critical') {
    const colorMap = {
        info: {
            bgLight: 'bg-blue-50',
            bgDark: 'dark:bg-blue-950/20',
            borderLight: 'border-blue-200',
            borderDark: 'dark:border-blue-900/50',
            textLight: 'text-blue-900',
            textDark: 'dark:text-blue-200',
            iconLight: 'text-blue-600',
            iconDark: 'dark:text-blue-400',
            hoverBgLight: 'hover:bg-blue-100',
            hoverBgDark: 'dark:hover:bg-blue-900/40',
        },
        warning: {
            bgLight: 'bg-amber-50',
            bgDark: 'dark:bg-amber-950/20',
            borderLight: 'border-amber-200',
            borderDark: 'dark:border-amber-900/50',
            textLight: 'text-amber-900',
            textDark: 'dark:text-amber-200',
            iconLight: 'text-amber-600',
            iconDark: 'dark:text-amber-400',
            hoverBgLight: 'hover:bg-amber-100',
            hoverBgDark: 'dark:hover:bg-amber-900/40',
        },
        critical: {
            bgLight: 'bg-red-50',
            bgDark: 'dark:bg-red-950/20',
            borderLight: 'border-red-200',
            borderDark: 'dark:border-red-900/50',
            textLight: 'text-red-900',
            textDark: 'dark:text-red-200',
            iconLight: 'text-red-600',
            iconDark: 'dark:text-red-400',
            hoverBgLight: 'hover:bg-red-100',
            hoverBgDark: 'dark:hover:bg-red-900/40',
        },
    };

    const colors = colorMap[severity];
    return {
        bg: cn(colors.bgLight, colors.bgDark),
        border: cn(colors.borderLight, colors.borderDark),
        text: cn(colors.textLight, colors.textDark),
        icon: cn(colors.iconLight, colors.iconDark),
        hoverBg: cn(colors.hoverBgLight, colors.hoverBgDark),
    };
}

/**
 * Get card/component styling with light/dark mode support
 */
export function getComponentColors() {
    return {
        cardBg: 'bg-white dark:bg-zinc-900',
        cardBorder: 'border-gray-200 dark:border-zinc-800',
        cardText: 'text-zinc-900 dark:text-zinc-100',
        cardSubtext: 'text-zinc-600 dark:text-zinc-400',
        hoverBg: 'hover:bg-gray-50 dark:hover:bg-zinc-800/50',
        hoverBorder: 'border-gray-300 dark:border-zinc-700',
    };
}

/**
 * Get chart colors with light/dark mode support
 */
export function getChartColors(mode: 'light' | 'dark' = 'dark') {
    if (mode === 'light') {
        return {
            gridColor: '#d1d5db', // gray-300
            textColor: '#4b5563', // gray-700
            tooltipBg: '#ffffff',
            tooltipText: '#000000',
        };
    }
    return {
        gridColor: '#3f4655', // gray-700 (dark)
        textColor: '#d1d5db', // gray-300
        tooltipBg: '#18212f', // zinc-800
        tooltipText: '#f1f5f9', // slate-100
    };
}
