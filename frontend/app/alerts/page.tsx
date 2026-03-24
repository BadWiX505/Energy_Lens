'use client';

import { useEffect, useState } from 'react';
import { useAlertStore } from '@/store/alertStore';
import { getAlerts, markAllAlertsRead } from '@/lib/api';
import { AlertCard } from '@/components/ui/AlertCard';
import { Bell, CheckCheck, Filter } from 'lucide-react';
import type { AlertSeverity, AlertType } from '@/types';
import { cn } from '@/lib/utils';

const FILTERS: { label: string; value: string }[] = [
    { label: 'All', value: 'all' },
    { label: 'Critical', value: 'critical' },
    { label: 'Warning', value: 'warning' },
    { label: 'Info', value: 'info' },
];

export default function AlertsPage() {
    const { alerts, unreadCount, markRead, markAllRead, setAlerts } = useAlertStore();
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        getAlerts().then(setAlerts).finally(() => setLoading(false));
    }, [setAlerts]);

    const filtered = filter === 'all'
        ? alerts
        : alerts.filter((a) => a.severity === filter);

    const handleMarkAllRead = () => {
        markAllRead();
        markAllAlertsRead().catch(console.error);
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                        <Bell className="w-5 h-5 text-violet-400" />
                        Alerts
                        {unreadCount > 0 && (
                            <span className="ml-1 text-xs font-bold bg-red-500 text-white px-2 py-0.5 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </h2>
                    <p className="text-xs text-zinc-400">{alerts.length} total alerts</p>
                </div>

                <div className="flex items-center gap-2">
                    {/* Severity filter */}
                    <div className="flex items-center bg-zinc-800/80 rounded-xl p-1 border border-white/5">
                        {FILTERS.map(({ label, value }) => (
                            <button
                                key={value}
                                onClick={() => setFilter(value)}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${filter === value
                                        ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllRead}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 border border-white/5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-700 transition-all"
                        >
                            <CheckCheck className="w-3.5 h-3.5" />
                            Mark all read
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: 'Critical', count: alerts.filter(a => a.severity === 'critical').length, color: 'text-red-400 bg-red-500/10 border-red-500/20' },
                    { label: 'Warnings', count: alerts.filter(a => a.severity === 'warning').length, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
                    { label: 'Info', count: alerts.filter(a => a.severity === 'info').length, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
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
                        <div key={i} className="h-20 rounded-xl bg-zinc-800/50 animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                    <Bell className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-400 text-sm">No {filter !== 'all' ? filter : ''} alerts</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((alert) => (
                        <AlertCard
                            key={alert.id}
                            alert={alert}
                            onRead={markRead}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
