'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';

const PAGE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/insights': 'Insights',
    '/alerts': 'Alerts',
    '/goals': 'Goals & Gamification',
    '/settings': 'Settings',
};

export function RootLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const pathname = usePathname();
    const title = PAGE_TITLES[pathname] ?? 'Energy Lens';
    const isAuthRoute = pathname === '/login';

    if (isAuthRoute) {
        return (
            <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
                {children}
            </div>
        );
    }

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            <Sidebar
                open={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                collapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
            />
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Navbar title={title} onMenuClick={() => setSidebarOpen(true)} />
                <main className="flex-1 overflow-y-auto">
                    <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
