'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Leaf, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTipsStore } from '@/store/tipsStore';
import type { Tip } from '@/types';

// ─── Easily editable constant ───────────────────────────────
const TIP_DISPLAY_SECONDS = 10;
// ────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    cuisine:   { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
    éclairage: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
    nuit:      { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-300 dark:border-indigo-700' },
    soleil:    { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
    lessive:   { bg: 'bg-sky-100 dark:bg-sky-900/40', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700' },
    general:   { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
};

function getCategoryStyle(tag: string) {
    const key = tag.toLowerCase();
    return CATEGORY_COLORS[key] ?? CATEGORY_COLORS['general'];
}

// ── Robust image with fallback chain ──────────────────────────
function TipImage({ urls, title }: { urls: string[]; title: string }) {
    const [imgIndex, setImgIndex] = useState(0);
    const [failed, setFailed] = useState(urls.length === 0);

    useEffect(() => {
        setImgIndex(0);
        setFailed(urls.length === 0);
    }, [urls]);

    const handleError = useCallback(() => {
        const next = imgIndex + 1;
        if (next < urls.length) {
            setImgIndex(next);
        } else {
            setFailed(true);
        }
    }, [imgIndex, urls]);

    if (failed || urls.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-400/30 via-emerald-400/20 to-sky-400/20 dark:from-amber-500/20 dark:via-emerald-500/15 dark:to-sky-500/15">
                <div className="w-20 h-20 rounded-full bg-white/60 dark:bg-white/10 flex items-center justify-center shadow-lg mb-3">
                    <Lightbulb className="w-10 h-10 text-amber-500" />
                </div>
                <p className="text-xs text-center text-amber-700 dark:text-amber-300 font-medium px-4 line-clamp-2">{title}</p>
            </div>
        );
    }

    return (
        <img
            src={urls[imgIndex]}
            alt={title}
            onError={handleError}
            className="w-full h-full object-cover"
            loading="lazy"
        />
    );
}

// ── Progress dot indicator ──────────────────────────────────
function DotIndicator({ count, active }: { count: number; active: number }) {
    if (count <= 1) return null;
    return (
        <div className="flex items-center justify-center gap-1.5 mt-4">
            {Array.from({ length: count }).map((_, i) => (
                <span
                    key={i}
                    className={`block rounded-full transition-all duration-300 ${
                        i === active
                            ? 'w-5 h-2 bg-emerald-500 dark:bg-emerald-400'
                            : 'w-2 h-2 bg-zinc-300 dark:bg-zinc-600'
                    }`}
                />
            ))}
        </div>
    );
}

// ── Timer bar ───────────────────────────────────────────────
function TimerBar({ durationMs, key: barKey }: { durationMs: number; key: React.Key }) {
    return (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-200 dark:bg-zinc-700 overflow-hidden rounded-b-2xl">
            <div
                key={barKey}
                className="h-full bg-emerald-500 dark:bg-emerald-400 origin-left"
                style={{
                    animation: `tipProgress ${durationMs}ms linear forwards`,
                }}
            />
        </div>
    );
}

// ── Empty state ─────────────────────────────────────────────
function EmptyTipsState() {
    return (
        <div className="flex flex-col items-center justify-center h-full py-10 gap-3 select-none">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Pas encore de conseils</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center max-w-48">
                Vos conseils personnalisés apparaîtront ici bientôt ✨
            </p>
        </div>
    );
}

// ── Single tip slide ─────────────────────────────────────────
function TipSlide({ tip, visible }: { tip: Tip; visible: boolean }) {
    const cat = getCategoryStyle(tip.categoryTag);

    return (
        <div
            className={`absolute inset-0 flex flex-col transition-opacity duration-700 ${
                visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
        >
            {/* Top: image — fixed height, full width with padding */}
            <div className="flex-shrink-0 px-4 pt-4">
                <div className="w-full h-44 rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                    <TipImage urls={tip.imageUrls ?? []} title={tip.title} />
                </div>
            </div>

            {/* Bottom: content */}
            <div className="flex-1 flex flex-col px-5 py-4 gap-2 min-h-0 overflow-hidden">
                {/* Category badge */}
                <span className={`self-start text-xs font-bold px-3 py-1 rounded-full border ${cat.bg} ${cat.text} ${cat.border} uppercase tracking-wide flex-shrink-0`}>
                    {tip.categoryTag}
                </span>

                {/* Title */}
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug flex-shrink-0">
                    {tip.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed flex-1 min-h-0">
                    {tip.description}
                </p>

                {/* Savings badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700/50 rounded-full px-3 py-1.5">
                        <Leaf className="w-3.5 h-3.5" />
                        {tip.estimatedSavings}
                    </span>
                </div>
            </div>
        </div>
    );
}

// ── Main card ────────────────────────────────────────────────
    export function TipsCard({mode} :{mode: string}) {
    const tips = useTipsStore((s) => s.tips);
    const [index, setIndex] = useState(0);
    const [barKey, setBarKey] = useState(0);

    const total = tips.length;
    const DURATION_MS = TIP_DISPLAY_SECONDS * 1000;

    // Keep index in bounds when tips change
    useEffect(() => {
        if (total > 0 && index >= total) setIndex(0);
    }, [total, index]);

    // Auto-advance every TIP_DISPLAY_SECONDS
    useEffect(() => {
        if (total <= 1) return;
        const timer = setInterval(() => {
            setIndex((i) => (i + 1) % total);
            setBarKey((k) => k + 1);
        }, DURATION_MS);
        return () => clearInterval(timer);
    }, [total, DURATION_MS]);

    const goTo = (i: number) => {
        setIndex(i);
        setBarKey((k) => k + 1);
    };

    return (
        <div className={`relative rounded-2xl border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-900/80 shadow-sm overflow-hidden flex flex-col ${mode === 'live' ? 'h-140' : 'h-120'}`}>
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Conseils Énergie</h3>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {total > 0 ? `${total} conseil${total > 1 ? 's' : ''} personnalisé${total > 1 ? 's' : ''}` : 'Analyse en cours…'}
                        </p>
                    </div>
                </div>

                {/* Navigation arrows */}
                {total > 1 && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => goTo((index - 1 + total) % total)}
                            className="w-7 h-7 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Précédent"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500 min-w-[2.5rem] text-center">
                            {index + 1}/{total}
                        </span>
                        <button
                            onClick={() => goTo((index + 1) % total)}
                            className="w-7 h-7 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            aria-label="Suivant"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="relative flex-1 min-h-0">
                {total === 0 ? (
                    <EmptyTipsState />
                ) : (
                    tips.map((tip, i) => (
                        <TipSlide key={tip.id} tip={tip} visible={i === index} />
                    ))
                )}
            </div>

            {/* Dot indicator */}
            {total > 1 && (
                <div className="pb-4">
                    <DotIndicator count={total} active={index} />
                </div>
            )}

            {/* Timer progress bar */}
            {total > 1 && <TimerBar durationMs={DURATION_MS} key={barKey} />}

            {/* Global keyframe for timer bar — injected once via a style tag */}
            <style jsx global>{`
                @keyframes tipProgress {
                    from { transform: scaleX(0); }
                    to   { transform: scaleX(1); }
                }
            `}</style>
        </div>
    );
}
