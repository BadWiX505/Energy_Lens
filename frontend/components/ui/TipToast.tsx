'use client';

import { Lightbulb, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TipToastProps {
    title: string;
    description: string;
    onClose: () => void;
    onClick?: () => void;
}

/**
 * Toast notification component for new energy saving tips
 * Displays tip title and description in an emerald-themed card
 */
export function TipToast({ title, description, onClose, onClick }: TipToastProps) {
    return (
        <div
            className={cn(
                'w-full max-w-md rounded-lg border backdrop-blur-sm shadow-lg cursor-pointer',
                'bg-emerald-50 dark:bg-emerald-950/30',
                'border-emerald-200 dark:border-emerald-900/50',
                'transition-all duration-300 ease-out',
            )}
            onClick={onClick}
        >
            <div className="flex items-start gap-3 p-4">
                <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-0.5">
                        Energy Tip
                    </p>
                    <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100 truncate">
                        {title}
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed line-clamp-2">
                        {description}
                    </p>
                </div>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="flex-shrink-0 p-1 rounded text-emerald-500 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
