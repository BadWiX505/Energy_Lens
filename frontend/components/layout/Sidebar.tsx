'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Cpu, Bell, Target, Settings, Zap, X, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlertStore } from '@/store/alertStore';
import { useSettingsStore } from '@/store/settingsStore';

const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/insights', icon: Cpu, label: 'Insights' },
    { href: '/alerts', icon: Bell, label: 'Alerts', badge: true },
    { href: '/goals', icon: Target, label: 'Goals' },
    { href: '/settings', icon: Settings, label: 'Settings' },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
    const pathname = usePathname();
    const unreadCount = useAlertStore((s) => s.unreadCount);
    const { homes, selectedHomeId, selectHome } = useSettingsStore();
    const selectedHome = homes.find((h) => h.id === selectedHomeId);

    return (
        <>
            {/* Mobile overlay */}
            {open && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 bg-zinc-900 border-r border-white/5 transition-transform duration-300',
                    open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-white/5">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                            <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-white text-sm tracking-wide">Energy</span>
                            <span className="font-bold text-violet-400 text-sm">Lens</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Home selector */}
                <div className="px-4 py-3 border-b border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1.5">Active Home</p>
                    <select
                        value={selectedHomeId}
                        onChange={(e) => selectHome(e.target.value)}
                        className="w-full bg-zinc-800 text-zinc-200 text-xs rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500"
                    >
                        {homes.map((h) => (
                            <option key={h.id} value={h.id}>
                                {h.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
                        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                                className={cn(
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                                    active
                                        ? 'bg-violet-500/15 text-violet-300 shadow-sm'
                                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                                )}
                            >
                                <Icon className={cn('w-4 h-4', active ? 'text-violet-400' : 'text-zinc-500 group-hover:text-zinc-300')} />
                                <span className="flex-1">{label}</span>
                                {badge && unreadCount > 0 && (
                                    <span className="text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                                {active && <ChevronRight className="w-3 h-3 text-violet-400 opacity-60" />}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            U
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-zinc-200 truncate">User</p>
                            <p className="text-[10px] text-zinc-500 truncate">{selectedHome?.location}</p>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}
