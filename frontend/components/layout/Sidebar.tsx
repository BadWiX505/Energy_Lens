'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Cpu, Bell, Target, Settings, Zap, X, ChevronRight, ChevronLeft, Home as HomeIcon, LogOut, PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAlertStore } from '@/store/alertStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

const NAV_ITEMS = [
    { href: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
    { href: '/homes', icon: HomeIcon, label: 'Résidences & Appareils' },
    { href: '/insights', icon: Cpu, label: 'Analyse' },
    { href: '/alerts', icon: Bell, label: 'Alertes', badge: true },
    { href: '/goals', icon: Target, label: 'Objectifs' },
    { href: '/settings', icon: Settings, label: 'Paramètres' },
];

interface SidebarProps {
    open: boolean;
    onClose: () => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
}

export function Sidebar({ open, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const unreadCount = useAlertStore((s) => s.unreadCount);
    const { homes, selectedHomeId, selectHome } = useSettingsStore();
    const { user, logout } = useAuthStore();

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
                    'fixed lg:static inset-y-0 left-0 z-40 flex flex-col bg-white dark:bg-zinc-900 border-r border-black/5 dark:border-white/5 transition-all duration-300',
                    collapsed ? 'w-14' : 'w-64',
                    open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                )}
            >
                {/* Logo */}
                <div className={cn(
                    'flex items-center border-b border-black/5 dark:border-white/5',
                    collapsed ? 'justify-center px-0 py-5' : 'justify-between px-5 py-5'
                )}>
                    {/* Expanded Logo */}
                    {!collapsed && (
                        <div className="flex items-center gap-2.5">
                            <Image
                                src="/Energy_lens_Logo.svg"
                                alt="EnergyLens Logo"
                                width={40}
                                height={40}
                                className="flex-shrink-0 rounded-lg object-contain"
                            />
                            <div>
                                <span className="font-bold text-zinc-700/90 dark:text-white text-sm tracking-wide">Energy</span>
                                <span className="font-bold text-violet-400 text-sm">Lens</span>
                            </div>
                        </div>
                    )}

                    {/* Collapsed Logo */}
                    {collapsed && (
                        <Image
                            src="/Energy_lens_Logo.svg"
                            alt="EnergyLens Logo"
                            width={40}
                            height={40}
                            className="rounded-lg object-contain"
                        />
                    )}
                    {/* Mobile close button */}
                    <button
                        onClick={onClose}
                        className={cn('lg:hidden text-zinc-500 dark:text-zinc-400 hover:text-white transition-colors', collapsed && 'hidden')}
                    >
                        <X className="w-4 h-4" />
                    </button>

                    {/* Desktop collapse toggle button */}
                    {!collapsed && onToggleCollapse && (
                        <button
                            onClick={onToggleCollapse}
                            title="Collapse sidebar"
                            className="hidden lg:flex cursor-pointer items-center justify-center w-7 h-7 rounded-lg dark:text-zinc-400 text-zinc-600/80  dark:hover:text-zinc-100 dark:hover:bg-white/10 hover:bg-zinc-900/10 transition-colors"
                        >
                            <PanelLeftClose className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Expand button when collapsed (desktop only) */}
                {collapsed && onToggleCollapse && (
                    <div className="hidden lg:flex justify-center py-2 border-b border-black/5 dark:border-white/5">
                        <button
                            onClick={onToggleCollapse}
                            title="Expand sidebar"
                            className="flex cursor-pointer items-center justify-center w-8 h-8 rounded-lg dark:text-zinc-400 text-zinc-600/80  dark:hover:text-zinc-100 dark:hover:bg-white/10 hover:bg-zinc-900/10 transition-colors"
                        >
                            <PanelLeftOpen className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Home selector — hidden when collapsed */}
                {!collapsed && (
                    <div className="px-4 py-3 border-b border-black/5 dark:border-white/5">
                        <p className="text-[10px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">Résidence active</p>
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
                )}

                {/* Navigation */}
                <nav className={cn('flex-1 py-4 space-y-0.5 overflow-y-auto', collapsed ? 'px-1.5' : 'px-3')}>
                    {NAV_ITEMS.map(({ href, icon: Icon, label, badge }) => {
                        const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                onClick={() => { if (window.innerWidth < 1024) onClose(); }}
                                title={collapsed ? label : undefined}
                                className={cn(
                                    'group flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-150',
                                    collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5',
                                    active
                                        ? 'bg-violet-500/15 text-violet-500 dark:text-violet-300 shadow-sm'
                                        : 'text-zinc-900 dark:text-zinc-100 hover:bg-black/5 dark:bg-white/5 dark:hover:text-zinc-100'
                                )}
                            >
                                <div className="relative flex-shrink-0">
                                    <Icon className={cn('w-4 h-4', active ? 'dark:text-violet-400 text-violet-500' : 'text-zinc-900 dark:text-zinc-500 dark:text-zinc-300 dark:bg-white/5 dark:hover:text-zinc-100')} />
                                    {/* Badge dot on icon when collapsed */}
                                    {collapsed && badge && unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                                    )}
                                </div>
                                {!collapsed && (
                                    <>
                                        <span className="flex-1">{label}</span>
                                        {badge && unreadCount > 0 && (
                                            <span className="text-[10px] font-bold bg-red-500 text-white rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                                                {unreadCount > 99 ? '99+' : unreadCount}
                                            </span>
                                        )}
                                        {active && <ChevronRight className="w-3 h-3 text-violet-400 opacity-60" />}
                                    </>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className={cn('border-t border-black/5 dark:border-white/5', collapsed ? 'px-1.5 py-3' : 'px-4 py-4')}>
                    {collapsed ? (
                        <div className="flex flex-col items-center gap-2">
                            <div
                                title={user?.name || 'User'}
                                className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-inner cursor-default"
                            >
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <button
                                onClick={handleLogout}
                                title="Log Out"
                                className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
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
                    )}
                </div>
            </aside>
        </>
    );
}

