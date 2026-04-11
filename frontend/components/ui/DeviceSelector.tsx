'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useEnergyStore } from '@/store/energyStore';
import { ChevronDown } from 'lucide-react';
import type { Device } from '@/types';

/**
 * DeviceSelector — UI component for selecting which device to monitor
 * 
 * Features:
 * - Shows all devices from the selected home
 * - Persists selection to localStorage via energyStore
 * - Dropdown on desktop, button group on mobile
 * - Shows device name and status
 * - Handles no devices state
 */
export function DeviceSelector() {
    const { homes, selectedHomeId } = useSettingsStore();
    const { selectedDeviceId, setSelectedDevice } = useEnergyStore();
    const [isOpen, setIsOpen] = useState(false);

    // Get devices from selected home
    const selectedHome = homes.find((h) => h.id === selectedHomeId);
    const devices = selectedHome?.devices || [];

    // When the selected home changes, reset the device to the new home's first device.
    useEffect(() => {
        if (devices.length === 0) return;
        const belongsToHome = devices.some((d) => d.id === selectedDeviceId);
        if (!belongsToHome) {
            setSelectedDevice(devices[0].id);
        }
    }, [selectedHomeId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Show loading state if no devices
    if (devices.length === 0) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                <span className="text-xs text-yellow-700 dark:text-yellow-400">No devices available</span>
            </div>
        );
    }

    // Auto-select first device if none selected
    const currentDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

    const handleSelectDevice = (deviceId: string) => {
        setSelectedDevice(deviceId);
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block">
            {/* Dropdown Trigger */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-black/5 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 transition-colors text-xs font-medium text-zinc-700 dark:text-zinc-200"
            >
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{currentDevice?.name || 'Select device'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute top-full mt-1 left-0 min-w-max bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg shadow-lg shadow-black/10 dark:shadow-black/40 z-50">
                    <div className="py-1">
                        {devices.map((device) => (
                            <button
                                key={device.id}
                                onClick={() => handleSelectDevice(device.id)}
                                className={`w-full text-left px-4 py-2 text-xs transition-colors ${
                                    selectedDeviceId === device.id
                                        ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-900 dark:text-violet-100 font-medium'
                                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${selectedDeviceId === device.id ? 'bg-violet-500' : 'bg-zinc-300 dark:bg-zinc-600'}`} />
                                    <span>{device.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Close dropdown when clicking outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
