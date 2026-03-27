'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { validateMeApi } from '@/lib/api';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, token, logout, updateUser } = useAuthStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const validateToken = async () => {
            if (token) {
                try {
                    const data = await validateMeApi();
                    if (data.user) {
                        updateUser(data.user);
                    }
                } catch (error) {
                    // Token is invalid/expired
                    logout();
                    if (pathname !== '/login') {
                        router.push('/login');
                    }
                }
            }
        };

        if (isAuthenticated && token) {
            validateToken();
        }
    }, [isAuthenticated, token, logout, router, updateUser, pathname]);

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
