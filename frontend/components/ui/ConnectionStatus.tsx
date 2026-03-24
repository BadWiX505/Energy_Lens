'use client';

import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
    connected: boolean;
    className?: string;
}

export function ConnectionStatus({ connected, className }: ConnectionStatusProps) {
    return (
        <div
            className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border',
                connected
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-red-500/10 border-red-500/20 text-red-400',
                className
            )}
        >
            <span className={cn('w-1.5 h-1.5 rounded-full', connected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400')} />
            {connected ? <><Wifi className="w-3 h-3 opacity-80" /> Live</> : <><WifiOff className="w-3 h-3 opacity-80" /> Offline</>}
        </div>
    );
}
