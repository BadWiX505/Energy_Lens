'use client';

import { useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { Plus, Home as HomeIcon, MapPin, Trash2, Cpu, Hash } from 'lucide-react';
import type { Home, Device } from '@/types';

export default function HomesPage() {
    const { homes, addHome, removeHome, addDevice, removeDevice } = useSettingsStore();

    // State for New Home Form
    const [isAddingHome, setIsAddingHome] = useState(false);
    const [newHomeName, setNewHomeName] = useState('');
    const [newHomeLocation, setNewHomeLocation] = useState('');

    // State for New Device Form
    const [addingDeviceToHomeId, setAddingDeviceToHomeId] = useState<string | null>(null);
    const [newDeviceName, setNewDeviceName] = useState('');
    const [newDeviceCode, setNewDeviceCode] = useState('');

    const handleAddHome = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHomeName.trim() || !newHomeLocation.trim()) return;

        const newHome: Home = {
            id: Math.random().toString(36).substr(2, 9),
            name: newHomeName,
            location: newHomeLocation,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            devices: [],
        };
        addHome(newHome);
        setIsAddingHome(false);
        setNewHomeName('');
        setNewHomeLocation('');
    };

    const handleAddDevice = (e: React.FormEvent, homeId: string) => {
        e.preventDefault();
        if (!newDeviceName.trim() || !newDeviceCode.trim()) return;

        const newDevice: Device = {
            id: Math.random().toString(36).substr(2, 9),
            name: newDeviceName,
            code: newDeviceCode,
        };
        addDevice(homeId, newDevice);
        setAddingDeviceToHomeId(null);
        setNewDeviceName('');
        setNewDeviceCode('');
    };

    return (
        <div className="space-y-6 pb-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Homes & Devices</h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Manage your monitored properties and connected appliances.</p>
                </div>
                <button
                    onClick={() => setIsAddingHome(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold transition-all shadow-lg shadow-violet-500/20"
                >
                    <Plus className="w-4 h-4" />
                    Add Home
                </button>
            </div>

            {/* Add Home Form */}
            {isAddingHome && (
                <div className="bg-white dark:bg-zinc-900 border border-violet-500/20 rounded-2xl p-5 shadow-xl shadow-black/5 dark:shadow-black/20">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                        <HomeIcon className="w-4 h-4 text-violet-500" />
                        Register New Home
                    </h3>
                    <form onSubmit={handleAddHome} className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="w-full sm:flex-1 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">Home Name</label>
                            <input
                                type="text"
                                required
                                value={newHomeName}
                                onChange={(e) => setNewHomeName(e.target.value)}
                                placeholder="e.g. Summer House"
                                className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                        </div>
                        <div className="w-full sm:flex-1 space-y-1">
                            <label className="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">Location</label>
                            <input
                                type="text"
                                required
                                value={newHomeLocation}
                                onChange={(e) => setNewHomeLocation(e.target.value)}
                                placeholder="e.g. Malibu, CA"
                                className="w-full px-3 py-2 border border-black/10 dark:border-white/10 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                            <button
                                type="button"
                                onClick={() => setIsAddingHome(false)}
                                className="px-4 py-2 border border-black/10 dark:border-white/10 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-1 sm:flex-none"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors flex-1 sm:flex-none"
                            >
                                Save Home
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Homes List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {homes.map((home) => (
                    <div key={home.id} className="bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm flex flex-col">

                        {/* Home Header */}
                        <div className="p-5 border-b border-black/5 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-800/20 flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center">
                                    <HomeIcon className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{home.name}</h3>
                                    <div className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                        <MapPin className="w-3 h-3" />
                                        <span>{home.location}</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this home?')) {
                                        removeHome(home.id);
                                    }
                                }}
                                className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                                title="Delete Home"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Devices Section */}
                        <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                                    <Cpu className="w-3.5 h-3.5 text-zinc-400" />
                                    Connected Devices
                                </h4>
                                <button
                                    onClick={() => setAddingDeviceToHomeId(home.id)}
                                    className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2.5 py-1 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                                >
                                    + Add Device
                                </button>
                            </div>

                            {/* Add Device Form specific to this home */}
                            {addingDeviceToHomeId === home.id && (
                                <form onSubmit={(e) => handleAddDevice(e, home.id)} className="mb-4 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-black/5 dark:border-white/5 space-y-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            required
                                            value={newDeviceName}
                                            onChange={(e) => setNewDeviceName(e.target.value)}
                                            placeholder="Device Name (e.g. Smart Meter)"
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                        <input
                                            type="text"
                                            required
                                            value={newDeviceCode}
                                            onChange={(e) => setNewDeviceCode(e.target.value)}
                                            placeholder="Code/ID"
                                            className="w-full px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-black/10 dark:border-white/10 rounded-lg text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setAddingDeviceToHomeId(null)}
                                            className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-3 py-1.5 text-[10px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg transition-colors"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* Devices List */}
                            {home.devices && home.devices.length > 0 ? (
                                <div className="space-y-2">
                                    {home.devices.map(device => (
                                        <div key={device.id} className="flex items-center justify-between p-2.5 rounded-xl border border-black/5 dark:border-white/5 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                    <Cpu className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{device.name}</p>
                                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-0.5 mt-0.5">
                                                        <Hash className="w-2.5 h-2.5" />
                                                        {device.code}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Remove this device?')) {
                                                        removeDevice(home.id, device.id);
                                                    }
                                                }}
                                                className="p-1.5 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                                                title="Remove Device"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                                    <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-800/50 flex items-center justify-center mb-3">
                                        <Cpu className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                                    </div>
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">No devices connected</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">Add a device to start monitoring.</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {homes.length === 0 && (
                    <div className="col-span-full bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center mb-4">
                            <HomeIcon className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">No Homes Found</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">Register your first home to start tracking and analyzing energy consumption across different properties.</p>
                        <button
                            onClick={() => setIsAddingHome(true)}
                            className="mt-6 px-4 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                        >
                            + Register Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
