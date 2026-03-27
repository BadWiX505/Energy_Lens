'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from 'next-themes';
import { updateSettings } from '@/lib/api';
import type { UserSettings, Home } from '@/types';
import {
    Settings, Sun, Moon, Monitor, Home as HomeIcon, Plus, Check, Save, AlertTriangle, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Color warning helper for threshold fields
function getThresholdColor(value: number, low: number, high: number): string {
    if (value >= high) return 'border-red-500/50 focus:ring-red-500 bg-red-500/5';
    if (value >= low) return 'border-amber-500/50 focus:ring-amber-500 bg-amber-500/5';
    return 'border-black/10 dark:border-white/10 focus:ring-violet-500';
}

function ThresholdHint({ value, low, high, unit }: { value: number; low: number; high: number; unit: string }) {
    if (value >= high) return (
        <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Very high — may cause critical alerts
        </p>
    );
    if (value >= low) return (
        <p className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Moderate — warnings will trigger at this level
        </p>
    );
    return (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 flex items-center gap-1">
            <Info className="w-3 h-3" /> Conservative threshold — good for energy saving
        </p>
    );
}

export default function SettingsPage() {
    const { settings, updateSettings: updateStore, homes, selectedHomeId, selectHome, addHome } = useSettingsStore();
    const { theme, setTheme } = useTheme();
    const [form, setForm] = useState<UserSettings>(settings);
    const [saving, setSaving] = useState(false);
    const [newHomeName, setNewHomeName] = useState('');
    const [newHomeLocation, setNewHomeLocation] = useState('');
    const [showAddHome, setShowAddHome] = useState(false);

    useEffect(() => { setForm(settings); }, [settings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const updated = await updateSettings(form);
            updateStore(updated);
            toast.success('Settings saved successfully!');
        } catch {
            toast.error('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    const handleAddHome = () => {
        if (!newHomeName.trim()) return;
        const home: Home = {
            id: Math.random().toString(36).slice(2),
            name: newHomeName.trim(),
            location: newHomeLocation.trim() || 'Unknown',
            timezone: 'UTC',
        };
        addHome(home);
        setNewHomeName('');
        setNewHomeLocation('');
        setShowAddHome(false);
        toast.success(`Home "${home.name}" added`);
    };

    const field = (key: keyof UserSettings) => ({
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const value = e.target.type === 'checkbox'
                ? (e.target as HTMLInputElement).checked
                : e.target.type === 'number'
                    ? Number(e.target.value)
                    : e.target.value;
            setForm((f) => ({ ...f, [key]: value }));
        },
    });

    return (
        <div className="space-y-6 pb-8 max-w-3xl">
            {/* Header */}
            <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-violet-400" />
                    Settings
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Preferences, thresholds, and profile configuration</p>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
                {/* Thresholds */}
                <Section title="Power Thresholds" description="Set warning levels for power monitoring">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField label="Max Power Threshold (W)" hint={
                            <ThresholdHint value={form.max_power_threshold} low={2000} high={3500} unit="W" />
                        }>
                            <input
                                type="number"
                                min={100}
                                max={10000}
                                value={form.max_power_threshold}
                                {...field('max_power_threshold')}
                                className={cn(
                                    'w-full rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border focus:outline-none focus:ring-1 transition-colors',
                                    getThresholdColor(form.max_power_threshold, 2000, 3500)
                                )}
                            />
                        </FormField>

                        <FormField label="Night Threshold (W)" hint={
                            <ThresholdHint value={form.night_threshold} low={300} high={800} unit="W" />
                        }>
                            <input
                                type="number"
                                min={50}
                                max={5000}
                                value={form.night_threshold}
                                {...field('night_threshold')}
                                className={cn(
                                    'w-full rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border focus:outline-none focus:ring-1 transition-colors',
                                    getThresholdColor(form.night_threshold, 300, 800)
                                )}
                            />
                        </FormField>
                    </div>
                </Section>

                {/* Pricing */}
                <Section title="Pricing & Billing" description="Configure electricity costs and billing period">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField label="Price per kWh">
                            <input
                                type="number"
                                step="0.001"
                                min={0}
                                value={form.price_per_kwh}
                                {...field('price_per_kwh')}
                                className="w-full rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                        </FormField>
                        <FormField label="Currency">
                            <input
                                type="text"
                                maxLength={5}
                                value={form.currency}
                                {...field('currency')}
                                className="w-full rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500"
                                placeholder="USD"
                            />
                        </FormField>
                        <FormField label="Billing Start Day (1–31)">
                            <input
                                type="number"
                                min={1}
                                max={31}
                                value={form.billing_start}
                                {...field('billing_start')}
                                className="w-full rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                        </FormField>
                    </div>
                </Section>

                {/* Notifications */}
                <Section title="Notifications" description="Control alert and notification behaviour">
                    <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-200/50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 cursor-pointer hover:bg-zinc-100 dark:bg-zinc-800 transition-colors">
                        <div>
                            <p className="text-sm text-zinc-900 dark:text-zinc-100">Enable Notifications</p>
                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Real-time alerts and anomaly warnings</p>
                        </div>
                        <div
                            onClick={() => setForm((f) => ({ ...f, enable_notifications: !f.enable_notifications }))}
                            className={cn(
                                'relative w-10 h-5.5 rounded-full transition-colors cursor-pointer flex-shrink-0',
                                form.enable_notifications ? 'bg-violet-600' : 'bg-zinc-700'
                            )}
                            style={{ height: '22px', width: '40px' }}
                        >
                            <span className={cn(
                                'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                                form.enable_notifications ? 'translate-x-5' : 'translate-x-0.5'
                            )} />
                        </div>
                    </label>
                </Section>

                {/* Account info */}
                <Section title="Account" description="Profile and metadata">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField label="Account Created">
                            <input
                                type="text"
                                readOnly
                                value={new Date(form.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                className="w-full rounded-xl px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800/50 border border-black/5 dark:border-white/5 cursor-not-allowed"
                            />
                        </FormField>
                    </div>
                </Section>

                {/* Save */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-sm text-white font-semibold transition-all shadow-lg shadow-violet-500/20"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                </div>
            </form>

            {/* Theme */}
            <Section title="Appearance" description="Choose your preferred color theme">
                <div className="grid grid-cols-3 gap-3">
                    {([
                        { value: 'dark', label: 'Dark', icon: Moon },
                        { value: 'light', label: 'Light', icon: Sun },
                        { value: 'system', label: 'System', icon: Monitor },
                    ] as const).map(({ value, label, icon: Icon }) => (
                        <button
                            key={value}
                            onClick={() => setTheme(value)}
                            className={cn(
                                'flex flex-col items-center gap-2 p-4 rounded-xl border transition-all',
                                theme === value
                                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                                    : 'border-black/5 dark:border-white/5 bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:border-black/10 dark:border-white/10 hover:text-zinc-800 dark:text-zinc-200'
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-xs font-medium">{label}</span>
                            {theme === value && <Check className="w-3 h-3" />}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Homes */}
            <Section title="Homes" description="Manage your monitored properties">
                <div className="space-y-2">
                    {homes.map((home) => (
                        <div
                            key={home.id}
                            onClick={() => selectHome(home.id)}
                            className={cn(
                                'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                                home.id === selectedHomeId
                                    ? 'border-violet-500/30 bg-violet-500/5 text-zinc-900 dark:text-zinc-100'
                                    : 'border-black/5 dark:border-white/5 bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 hover:border-black/10 dark:border-white/10 hover:text-zinc-800 dark:text-zinc-200'
                            )}
                        >
                            <HomeIcon className="w-4 h-4 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{home.name}</p>
                                <p className="text-[11px] opacity-60 truncate">{home.location}</p>
                            </div>
                            {home.id === selectedHomeId && <Check className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                        </div>
                    ))}

                    {showAddHome ? (
                        <div className="p-3 rounded-xl border border-violet-500/20 bg-violet-500/5 space-y-2">
                            <input
                                value={newHomeName}
                                onChange={(e) => setNewHomeName(e.target.value)}
                                placeholder="Home name"
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                            <input
                                value={newHomeLocation}
                                onChange={(e) => setNewHomeLocation(e.target.value)}
                                placeholder="Location (city, country)"
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                            <div className="flex gap-2">
                                <button onClick={() => setShowAddHome(false)} className="flex-1 py-1.5 rounded-lg text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 border border-black/10 dark:border-white/10 transition-colors">Cancel</button>
                                <button onClick={handleAddHome} className="flex-1 py-1.5 rounded-lg text-xs text-white bg-violet-600 hover:bg-violet-500 transition-colors font-semibold">Add</button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowAddHome(true)}
                            className="flex items-center gap-2 w-full p-3 rounded-xl border border-dashed border-black/10 dark:border-white/10 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:text-zinc-300 hover:border-white/20 transition-all text-xs"
                        >
                            <Plus className="w-4 h-4" /> Add Home
                        </button>
                    )}
                </div>
            </Section>
        </div>
    );
}

// ── Sub-components ───────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-zinc-900/70 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-black/5 dark:border-white/5 bg-zinc-100/50 dark:bg-zinc-900/50">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                {description && <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{description}</p>}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
    return (
        <div>
            <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">{label}</label>
            {children}
            {hint}
        </div>
    );
}
