'use client';

import { X, Lightbulb, Leaf } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ENERGY_TIPS } from '@/lib/mockData';
import { cn } from '@/lib/utils';

interface TipsDialogProps {
    open: boolean;
    onClose: () => void;
}

const categoryColors: Record<string, string> = {
    HVAC: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    Standby: 'bg-red-500/10 text-red-400 border-red-500/20',
    Lighting: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Laundry: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Timing: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    Refrigerator: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    Solar: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Behaviour: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export function TipsDialog({ open, onClose }: TipsDialogProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative z-10 w-full max-w-2xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-amber-500/5 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center">
                            <Lightbulb className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-white">Energy Saving Tips</h2>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Personalized recommendations</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tips list */}
                <div className="overflow-y-auto p-4 space-y-3">
                    {ENERGY_TIPS.map((tip) => {
                        // Dynamically resolve icon
                        const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[tip.icon] || Leaf;
                        const colorClass = categoryColors[tip.category] || 'bg-zinc-700/40 text-zinc-500 dark:text-zinc-400 border-zinc-600/30';

                        return (
                            <div
                                key={tip.id}
                                className="group flex gap-4 p-4 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 hover:border-black/10 dark:border-white/10 hover:bg-zinc-100 dark:bg-zinc-800 transition-all duration-200"
                            >
                                <div className={cn('flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center', colorClass)}>
                                    <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{tip.title}</h3>
                                        <span className={cn('flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border', colorClass)}>
                                            {tip.savingsEst}
                                        </span>
                                    </div>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{tip.description}</p>
                                    <span className={cn('inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-md border', colorClass)}>
                                        {tip.category}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-black/5 dark:border-white/5 bg-zinc-100/50 dark:bg-zinc-900/50">
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                        <Leaf className="w-3 h-3 text-emerald-400" />
                        Tips are generated based on your usage patterns
                    </p>
                </div>
            </div>
        </div>
    );
}
