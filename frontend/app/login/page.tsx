'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { loginApi, registerApi } from '@/lib/api';
import { Zap, Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const { setAuth } = useAuthStore();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isSignUp) {
                await registerApi(name, email, password);
                // Signup on this backend doesn't return a token, so we switch to login
                setIsSignUp(false);
                setPassword('');
                setError('Account created successfully! Please sign in.');
            } else {
                const data = await loginApi(email, password);
                setAuth(data.user, data.token);
                router.push('/');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError('');
    };

    return (
        <div className="flex flex-col flex-1 items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 mb-4 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                        EnergyLens
                    </h1>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                        {isSignUp ? 'Create your account to get started' : 'Welcome back to your dashboard'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-2xl shadow-black/5 dark:shadow-black/20 rounded-3xl p-6 sm:p-8">
                    {/* Error / Success Message */}
                    {error && (
                        <div className={`flex items-center gap-2 p-3 mb-4 rounded-xl text-xs font-semibold ${error.includes('successfully')
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-500/20'
                            }`}>
                            {error.includes('successfully') ? null : <AlertCircle className="w-4 h-4 shrink-0" />}
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div className="space-y-1">
                                <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Full Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className="h-4 w-4 text-zinc-400" />
                                    </div>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-zinc-400" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                    placeholder="you@example.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold uppercase text-zinc-500 dark:text-zinc-400">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-zinc-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-70 disabled:hover:bg-violet-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20 mt-6"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    {isSignUp ? 'Create Account' : 'Sign In'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {isSignUp ? 'Already have an account?' : 'Don\'t have an account?'}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="ml-1 text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                            >
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
