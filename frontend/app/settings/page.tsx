'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from 'next-themes';
import { getMyHomesApi } from '@/lib/api';
import { createPreferenceApi, defaultFormSettings, getPreferenceByHomeApi } from '@/lib/preferencesApi';
import type { UserSettings } from '@/types';
import {
    Settings, Sun, Moon, Monitor, Home as HomeIcon, Check, Save, AlertTriangle, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Color warning helper for threshold fields - updated for better contrast
function getThresholdColor(value: number, low: number, high: number): string {
    if (value >= high) return 'border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-900 dark:text-red-100';
    if (value >= low) return 'border-amber-300 dark:border-amber-500/50 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-100';
    return 'border-zinc-300 dark:border-zinc-700 focus:ring-violet-500/20 focus:border-violet-500 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100';
}

function ThresholdHint({ value, low, high, unit }: { value: number; low: number; high: number; unit: string }) {
    if (value >= high) return (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Very high — may cause critical alerts
        </p>
    );
    if (value >= low) return (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Moderate — warnings will trigger at this level
        </p>
    );
    return (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Conservative threshold — good for energy saving
        </p>
    );
}

export default function SettingsPage() {
    const { updateSettings: updateStore, homes, selectedHomeId, selectHome, setHomes } = useSettingsStore();
    const { theme, setTheme } = useTheme();
    const [form, setForm] = useState<UserSettings>(() => defaultFormSettings());
    const [saving, setSaving] = useState(false);
    const [prefLoading, setPrefLoading] = useState(false);
    const [prefError, setPrefError] = useState('');

    useEffect(() => {
        if (homes.length > 0) return;
        let cancelled = false;
        getMyHomesApi()
            .then((data) => {
                if (!cancelled) setHomes(data || []);
            })
            .catch(() => {
                if (!cancelled) toast.error('Could not load homes.');
            });
        return () => {
            cancelled = true;
        };
    }, [homes.length, setHomes]);

    useEffect(() => {
        if (!selectedHomeId) {
            setForm(defaultFormSettings());
            return;
        }
        let cancelled = false;
        setPrefLoading(true);
        setPrefError('');
        getPreferenceByHomeApi(selectedHomeId)
            .then((pref) => {
                if (cancelled) return;
                const next = pref ?? defaultFormSettings();
                setForm(next);
                updateStore(next);
            })
            .catch((err: unknown) => {
                if (cancelled) return;
                const msg = err instanceof Error ? err.message : 'Failed to load preferences';
                setPrefError(msg);
                toast.error(msg);
            })
            .finally(() => {
                if (!cancelled) setPrefLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [selectedHomeId, updateStore]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHomeId) {
            toast.error('Select a home first.');
            return;
        }
        setSaving(true);
        try {
            const created = await createPreferenceApi(selectedHomeId, form);
            setForm(created);
            updateStore(created);
            toast.success('Preferences saved (new record created).');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Failed to save preferences.';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
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
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-violet-500" />
                    Settings
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Per-home energy preferences (loaded from your backend; saving creates a new preference record).
                </p>
            </div>

            {prefError && !prefLoading && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-200 font-medium">
                    {prefError}
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
                {prefLoading && (
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                        Loading preferences for selected home…
                    </p>
                )}

                {/* Thresholds */}
                <Section title="Power Thresholds" description="Set warning levels for power monitoring">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                                    'w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors',
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
                                    'w-full rounded-lg px-3 py-2 text-sm border focus:outline-none focus:ring-2 transition-colors',
                                    getThresholdColor(form.night_threshold, 300, 800)
                                )}
                            />
                        </FormField>
                    </div>
                </Section>

                {/* Pricing */}
                <Section title="Pricing & Billing" description="Configure electricity costs and billing period">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <FormField label="Price per kWh">
                            <input
                                type="number"
                                step="0.001"
                                min={0}
                                value={form.price_per_kwh}
                                {...field('price_per_kwh')}
                                className="w-full rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                            />
                        </FormField>
                        <FormField label="Currency">
                            <input
                                type="text"
                                maxLength={5}
                                value={form.currency}
                                {...field('currency')}
                                className="w-full rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                                placeholder="MAD"
                            />
                        </FormField>
                        <FormField label="Billing Start Day (1–31)">
                            <input
                                type="number"
                                min={1}
                                max={31}
                                value={form.billing_start}
                                {...field('billing_start')}
                                className="w-full rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                            />
                        </FormField>
                    </div>
                </Section>

                {/* Notifications */}
                <Section title="Notifications" description="Control alert and notification behaviour">
                    <label className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Enable Notifications</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Real-time alerts and anomaly warnings</p>
                        </div>
                        <div
                            onClick={() => setForm((f) => ({ ...f, enable_notifications: !f.enable_notifications }))}
                            className={cn(
                                'relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0',
                                form.enable_notifications ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-600'
                            )}
                        >
                            <span className={cn(
                                'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                                form.enable_notifications ? 'translate-x-6' : 'translate-x-1'
                            )} />
                        </div>
                    </label>
                </Section>

                {/* Preference record metadata */}
                <Section title="Preference record" description="Timestamps from the backend preference row">
                    <div className="grid sm:grid-cols-2 gap-5">
                        <FormField label="Created / last loaded">
                            <input
                                type="text"
                                readOnly
                                value={
                                    Number.isNaN(new Date(form.created_at).getTime())
                                        ? '—'
                                        : new Date(form.created_at).toLocaleString('en-US', {
                                              year: 'numeric',
                                              month: 'short',
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                          })
                                }
                                className="w-full rounded-lg px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 cursor-not-allowed"
                            />
                        </FormField>
                    </div>
                </Section>

                {/* Save */}
                <div className="flex flex-col items-end gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={saving || prefLoading || !selectedHomeId || homes.length === 0}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:hover:bg-violet-600 text-sm text-white font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving…' : 'Save preferences'}
                    </button>
                    {!selectedHomeId && homes.length > 0 && (
                        <p className="text-xs text-zinc-500">Choose a home in the list below or the sidebar.</p>
                    )}
                </div>
            </form>

            <hr className="my-8 border-zinc-200 dark:border-zinc-800" />

            {/* Theme */}
            <Section title="Appearance" description="Choose your preferred color theme">
                <div className="grid grid-cols-3 gap-4">
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
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 ring-1 ring-violet-500'
                                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80'
                            )}
                        >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm font-medium">{label}</span>
                            {theme === value && <Check className="w-4 h-4 mt-1" />}
                        </button>
                    ))}
                </div>
            </Section>

            {/* Homes */}
            <Section title="Homes" description="Manage your monitored properties">
                <div className="space-y-3">
                    {homes.map((home) => (
                        <div
                            key={home.id}
                            onClick={() => selectHome(home.id)}
                            className={cn(
                                'flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                                home.id === selectedHomeId
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10 text-violet-900 dark:text-violet-100 ring-1 ring-violet-500'
                                    : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/80'
                            )}
                        >
                            <HomeIcon className={cn("w-5 h-5 flex-shrink-0", home.id === selectedHomeId ? "text-violet-600 dark:text-violet-400" : "")} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate text-zinc-900 dark:text-zinc-100">{home.name}</p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{home.location}</p>
                            </div>
                            {home.id === selectedHomeId && <Check className="w-5 h-5 text-violet-600 dark:text-violet-400 flex-shrink-0" />}
                        </div>
                    ))}
                    {homes.length === 0 && (
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 p-4 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-center">
                            No homes yet. Add homes from the Homes & Devices page.
                        </p>
                    )}
                </div>
            </Section>
        </div>
    );
}

// ── Sub-components ───────────────────────────────────────────

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800/80">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
                {description && <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{description}</p>}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: React.ReactNode }) {
    return (
        <div>
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">{label}</label>
            {children}
            {hint}
        </div>
    );
}