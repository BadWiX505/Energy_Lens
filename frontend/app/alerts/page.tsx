'use client';

import { useEffect, useState } from 'react';
import { useAlertStore } from '@/store/alertStore';
import { getAlerts, markAlertRead, deleteAllAlertsFromApi } from '@/lib/api';
import { AlertCard } from '@/components/ui/AlertCard';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/store/settingsStore';

const FILTERS: { label: string; value: string }[] = [
    { label: 'All', value: 'all' },
    { label: 'Critical', value: 'critical' },
    { label: 'Warning', value: 'warning' },
    { label: 'Info', value: 'info' },
];

export default function AlertsPage() {
    const { alerts, unreadCount, markRead, markAllRead, setAlerts, clearAlerts } = useAlertStore();
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(false);
    const [clearing, setClearing] = useState(false);
    const { selectedHomeId } = useSettingsStore();

    // Initial load
    useEffect(() => {
        if (!selectedHomeId) return;
        setLoading(true);
        getAlerts(selectedHomeId).then(setAlerts).finally(() => setLoading(false));
    }, [setAlerts, selectedHomeId]);

    const filtered = filter === 'all'
        ? alerts
        : alerts.filter((a) => a.severity === filter);

    const handleMarkAllRead = () => {
        markAllRead();
        // Since we removed global markAllRead API to be simple, we can do it iteratively
        // or just let it be a local state optimization until the page refreshes
        alerts.filter(a => !a.read).forEach(a => markAlertRead(a.id).catch(console.error));
    };

    const handleMarkRead = (id: string) => {
        markRead(id);
        markAlertRead(id).catch(console.error);
    };

    const handleClearAll = async () => {
        if (!selectedHomeId || alerts.length === 0) return;
        setClearing(true);
        try {
            await deleteAllAlertsFromApi(selectedHomeId);
            clearAlerts();
        } catch (err) {
            console.error('[AlertsPage] Failed to clear alerts:', err);
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-violet-400" />
                        Alerts
                        {unreadCount > 0 && (
                            <span className="ml-1 text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{alerts.length} total alerts</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Severity filter */}
                    <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-xl p-1 border border-black/5 dark:border-white/5">
                        {FILTERS.map(({ label, value }) => (
                            <button
                                key={value}
                                onClick={() => setFilter(value)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filter === value
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200  dark:hover:text-zinc-200  hover:bg-black/5 dark:bg-white/5 dark:hover:bg-violet-500/20'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-black/5 dark:border-white/5 text-xs text-zinc-700 dark:text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                        </button>
                    )}
                    {alerts.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            disabled={clearing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50 transition-all"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {clearing ? 'Clearing…' : 'Clear all'}
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Critical', count: alerts.filter(a => a.severity === 'critical').length, color: ' bg-red-50 border-red-200 text-red-700 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20' },
                    { label: 'Warnings', count: alerts.filter(a => a.severity === 'warning').length, color: 'bg-amber-50 border-amber-200 text-amber-700  dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20' },
                    { label: 'Info', count: alerts.filter(a => a.severity === 'info').length, color: 'bg-blue-50 border-blue-200 text-blue-700  dark:text-blue-400 dark:bg-blue-500/10 dark:border-blue-500/20' },
                ].map((s) => (
                    <div key={s.label} className={cn('rounded-2xl border p-4 text-center', s.color)}>
                        <p className="text-2xl font-bold">{s.count}</p>
                        <p className="text-[11px] opacity-80 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Alert list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <Bell className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500 dark:text-zinc-400 text-sm">No {filter !== 'all' ? filter : ''} alerts</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((alert,index) => (
                        <AlertCard
                            key={index}
                            alert={alert}
                            onRead={handleMarkRead}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
