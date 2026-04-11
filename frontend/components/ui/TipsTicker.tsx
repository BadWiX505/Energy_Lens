'use client';

import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Lightbulb } from 'lucide-react';
import { useTipsStore } from '@/store/tipsStore';

// How long each tip is shown before animating out (ms)
const DISPLAY_MS = 4500;
// Duration of the exit animation — must match .animate-tip-out in globals.css (ms)
const EXIT_MS = 380;

/**
 * TipsTicker — elevator-style tip rotator.
 * One tip visible at a time: slides in from the bottom, dwells, then exits to the top.
 * Reads from the existing tipsStore; renders nothing when there are no tips.
 */
export function TipsTicker() {
    const tips = useTipsStore((s) => s.tips);
    const [index, setIndex] = useState(0);
    const [phase, setPhase] = useState<'in' | 'out'>('in');

    // Keep index in bounds if tips array shrinks
    useEffect(() => {
        if (tips.length > 0 && index >= tips.length) {
            setIndex(0);
            setPhase('in');
        }
    }, [tips.length, index]);

    // After DISPLAY_MS, trigger exit animation
    useEffect(() => {
        if (tips.length <= 1) return;
        const t = setTimeout(() => setPhase('out'), DISPLAY_MS);
        return () => clearTimeout(t);
    }, [index, tips.length]);

    // After exit animation completes, advance to next tip
    useEffect(() => {
        if (phase !== 'out' || tips.length <= 1) return;
        const t = setTimeout(() => {
            setIndex((i) => (i + 1) % tips.length);
            setPhase('in');
        }, EXIT_MS);
        return () => clearTimeout(t);
    }, [phase, tips.length]);

    if (tips.length === 0) return null;

    const tip = tips[index];
    const IconComponent =
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[tip.iconName]) ??
        Lightbulb;

    return (
        <div className="relative flex items-stretch overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-500/[0.12] dark:via-amber-500/[0.05] dark:to-transparent shadow-lg shadow-amber-500/5 h-28">

            {/* Decorative glow blob */}
            <div className="pointer-events-none absolute -left-6 inset-y-0 w-40 bg-amber-400/20 dark:bg-amber-500/15 blur-2xl rounded-full" />

            {/* Static label column */}
            <div className="relative flex flex-col items-center justify-center gap-1.5 px-5 bg-amber-500/15 border-r border-amber-500/25 flex-shrink-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shadow-inner">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
                    Tips
                </span>
            </div>

            {/* Animated tip area */}
            <div className="relative flex-1 overflow-hidden">
                <div
                    key={`${tip.id}-${index}-${phase}`}
                    className={`absolute inset-0 flex items-center gap-5 px-6 ${
                        phase === 'in' ? 'animate-tip-in' : 'animate-tip-out'
                    }`}
                >
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <IconComponent className="w-7 h-7 text-amber-500 dark:text-amber-400" />
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-zinc-900 dark:text-zinc-50 truncate leading-tight">
                            {tip.title}
                        </p>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 hidden sm:block leading-snug">
                            {tip.description}
                        </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col items-end gap-2 flex-shrink-0 pr-2">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-4 py-1.5">
                            {tip.estimatedSavings}
                        </span>
                        <span className="hidden md:block text-xs font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 border border-black/5 dark:border-white/10 rounded-full px-3 py-1">
                            {tip.categoryTag}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tip counter dot indicator */}
            {tips.length > 1 && (
                <div className="relative flex flex-col items-center justify-center gap-1.5 px-4 flex-shrink-0">
                    {tips.map((_, i) => (
                        <div
                            key={i}
                            className={`rounded-full transition-all duration-300 ${
                                i === index
                                    ? 'w-2 h-2 bg-amber-500 shadow-sm shadow-amber-500/50'
                                    : 'w-1.5 h-1.5 bg-zinc-300 dark:bg-zinc-700'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
