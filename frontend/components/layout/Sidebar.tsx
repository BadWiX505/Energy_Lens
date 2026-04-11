'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Cpu, Bell, Target, Settings, Zap, X, ChevronRight, Home as HomeIcon, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlertStore } from '@/store/alertStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/homes', icon: HomeIcon, label: 'Homes & Devices' },
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
    const router = useRouter();
    const unreadCount = useAlertStore((s) => s.unreadCount);
    const { homes, selectedHomeId, selectHome } = useSettingsStore();
    const { user, logout } = useAuthStore();
    const selectedHome = homes.find((h) => h.id === selectedHomeId);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

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
                    'fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-64 bg-white dark:bg-zinc-900 border-r border-black/5 dark:border-white/5 transition-transform duration-300',
                    open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-5 py-5 border-b border-black/5 dark:border-white/5">
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
                        className="lg:hidden text-zinc-500 dark:text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Home selector */}
                <div className="px-4 py-3 border-b border-black/5 dark:border-white/5">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">Active Home</p>
                    <select
                        value={selectedHomeId}
                        onChange={(e) => selectHome(e.target.value)}
                        className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs rounded-lg px-3 py-2 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500"
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
                                        ? 'bg-violet-500/15 text-violet-500 dark:text-violet-300 shadow-sm'
                                        : 'text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:bg-white/5 dark:hover:text-zinc-100'
                                )}
                            >
                                <Icon className={cn('w-4 h-4', active ? 'dark:text-violet-400 text-violet-500' : 'text-zinc-900 dark:text-zinc-500  dark:text-zinc-300  dark:bg-white/5 dark:hover:text-zinc-100')} />
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
                <div className="px-4 py-4 border-t border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-3 px-2 justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-inner">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="min-w-0 pr-2">
                                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{user?.name || 'User'}</p>
                                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">{user?.email || 'user@example.com'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Log Out"
                            className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
