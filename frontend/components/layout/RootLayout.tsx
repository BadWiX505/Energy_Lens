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
    const pathname = usePathname();
    const title = PAGE_TITLES[pathname] ?? 'Energy Lens';

    return (
        <div className="flex h-screen overflow-hidden bg-zinc-950">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
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
