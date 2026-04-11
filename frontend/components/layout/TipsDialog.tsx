'use client';

import { useState } from 'react';
import { X, Lightbulb, Leaf, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTipsStore } from '@/store/tipsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { deleteTipFromApi, deleteAllTipsFromApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

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
    const tips = useTipsStore((state) => state.tips);
    const removeTip = useTipsStore((state) => state.removeTip);
    const clearTips = useTipsStore((state) => state.clearTips);
    const selectedHomeId = useSettingsStore((state) => state.selectedHomeId);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [isDeletingAll, setIsDeletingAll] = useState(false);

    const handleDeleteTip = async (tipId: string) => {
        setDeletingIds((prev) => new Set(prev).add(tipId));
        try {
            await deleteTipFromApi(tipId);
            removeTip(tipId);
            toast.success('Tip deleted');
        } catch (error) {
            toast.error('Failed to delete tip');
            console.error('Delete tip error:', error);
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(tipId);
                return next;
            });
        }
    };

    const handleDeleteAll = async () => {
        if (!selectedHomeId) {
            toast.error('No home selected');
            return;
        }
        setIsDeletingAll(true);
        try {
            await deleteAllTipsFromApi(selectedHomeId);
            clearTips();
            toast.success('All tips deleted');
        } catch (error) {
            toast.error('Failed to delete all tips');
            console.error('Delete all tips error:', error);
        } finally {
            setIsDeletingAll(false);
        }
    };

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
                            <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold dark:text-white">Energy Saving Tips</h2>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {tips.length === 0 ? 'No tips yet' : `${tips.length} tip${tips.length !== 1 ? 's' : ''}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 dark:hover:text-white hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tips list */}
                <div className="overflow-y-auto p-4 space-y-3 flex-1">
                    {tips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Leaf className="w-10 h-10 text-zinc-400 dark:text-zinc-600 mb-3" />
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
                                No tips yet. Tips will appear as your energy data is analyzed.
                            </p>
                        </div>
                    ) : (
                        tips.map((tip) => {
                            // Dynamically resolve icon
                            const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[tip.iconName] || Leaf;
                            const colorClass = categoryColors[tip.categoryTag] || 'bg-zinc-700/40 text-zinc-500 dark:text-zinc-400 border-zinc-600/30';
                            const isDeleting = deletingIds.has(tip.id);

                            return (
                                <div
                                    key={tip.id}
                                    className={cn(
                                        'group flex gap-4 p-4 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 hover:border-black/10 dark:border-white/10 dark:bg-zinc-800 transition-all duration-200',
                                        isDeleting && 'opacity-50'
                                    )}
                                >
                                    <div className={cn('flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center', colorClass)}>
                                        <IconComponent className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{tip.title}</h3>
                                            <span className={cn('flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border', colorClass)}>
                                                {tip.estimatedSavings || '—'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{tip.description}</p>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className={cn('inline-block text-[10px] px-1.5 py-0.5 rounded-md border', colorClass)}>
                                                {tip.categoryTag}
                                            </span>
                                            <button
                                                onClick={() => handleDeleteTip(tip.id)}
                                                disabled={isDeleting}
                                                className="p-1 rounded text-zinc-400 hover:text-red-400 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                title="Delete tip"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-black/5 dark:border-white/5 bg-zinc-100/50 dark:bg-zinc-900/50 flex items-center justify-between">
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
                        <Leaf className="w-3 h-3 text-emerald-400" />
                        Tips are generated based on your usage patterns
                    </p>
                    {tips.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            disabled={isDeletingAll}
                            className="text-[11px] px-2 py-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeletingAll ? 'Clearing...' : 'Clear all'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
