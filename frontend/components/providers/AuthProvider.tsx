'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { validateMeApi, getMyHomesApi, getDevicesByHomeApi } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, token, logout, updateUser } = useAuthStore();
    const { setHomes, setDevicesForHome, setHomesLoaded } = useSettingsStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
            const validateToken = async () => {
            if (!token) return;

            try {
                const data = await validateMeApi();
                if (data.user) {
                    updateUser(data.user);
                }
            } catch (error) {
                // Token is invalid/expired; log out and redirect only in this case.
                logout();
                if (pathname !== '/login') {
                    router.push('/login');
                }
                return;
            }

            await preloadHomesAndDevices();
        };

        const preloadHomesAndDevices = async () => {
            try {
                const homes = await getMyHomesApi();
                if (homes && homes.length > 0) {
                    setHomes(homes);
                    // Load devices for each home in parallel
                    await Promise.all(
                        homes.map((home) =>
                            getDevicesByHomeApi(home.id, { skip: 0, take: 100 })
                                .then((devices) => setDevicesForHome(home.id, devices))
                                .catch((err) => console.error(`Failed to load devices for home ${home.id}:`, err))
                        )
                    );
                } else {
                    setHomes([]);
                }
            } catch (error) {
                console.error('Failed to preload homes and devices:', error);
            } finally {
                setHomesLoaded(true); // Always mark preload as done, even on device load failures
            }
        };

        if (isAuthenticated && token) {
            validateToken();
        }
    }, [isAuthenticated, token, logout, router, updateUser, pathname, setHomes, setDevicesForHome, setHomesLoaded]);

    useEffect(() => {
        if (!mounted) return;

        if (!isAuthenticated && pathname !== '/login') {
            router.push('/login');
        } else if (isAuthenticated && pathname === '/login') {
            router.push('/');
        }
    }, [isAuthenticated, pathname, mounted, router]);

    // Avoid hydration mismatch and flash of unauthenticated content
    if (!mounted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="w-8 h-8 rounded-full border-4 border-violet-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    // If not authenticated and trying to access protected route, render nothing while redirecting
    if (!isAuthenticated && pathname !== '/login') {
        return null;
    }

    return <>{children}</>;
}
