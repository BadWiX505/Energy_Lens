'use client';

import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Bell, Lightbulb, Sun, Moon, Menu } from 'lucide-react';
import { useAlertStore } from '@/store/alertStore';
import { TipsDialog } from '@/components/layout/TipsDialog';
import { cn } from '@/lib/utils';

interface NavbarProps {
    title: string;
    onMenuClick: () => void;
}

export function Navbar({ title, onMenuClick }: NavbarProps) {
    const { theme, setTheme } = useTheme();
    const unreadCount = useAlertStore((s) => s.unreadCount);
    const [tipsOpen, setTipsOpen] = useState(false);

    return (
        <>
            <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 h-14 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                {/* Left: hamburger + title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onMenuClick}
                        className="lg:hidden p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
                </div>

                {/* Right: actions */}
                <div className="flex items-center gap-1">
                    {/* Tips */}
                    <button
                        onClick={() => setTipsOpen(true)}
                        className="relative p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                        title="Energy Tips"
                    >
                        <Lightbulb className="w-5 h-5" />
                    </button>

                    {/* Alerts */}
                    <a
                        href="/alerts"
                        className="relative p-2 rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                        title="Alerts"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5 shadow-lg shadow-red-500/40 animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </a>

                    {/* Theme toggle */}
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className={cn(
                            'p-2 rounded-lg transition-colors',
                            theme === 'dark'
                                ? 'text-amber-400 hover:bg-amber-500/20'
                                : 'text-violet-600 hover:bg-violet-100'
                        )}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </div>
            </header>

            <TipsDialog open={tipsOpen} onClose={() => setTipsOpen(false)} />
        </>
    );
}
