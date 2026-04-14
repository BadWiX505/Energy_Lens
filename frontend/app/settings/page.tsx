'use client';

import { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from 'next-themes';
import { getMyHomesApi } from '@/lib/api';
import { createPreferenceApi, defaultFormSettings, getPreferenceByHomeApi } from '@/lib/preferencesApi';
import type { UserSettings } from '@/types';
import {
    Settings, Sun, Moon, Monitor, Home as HomeIcon, Check, Save, AlertTriangle, Info, X, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// Color warning helper for threshold fields
function getThresholdColor(value: number, low: number, high: number): string {
    if (value >= high) return 'border-red-300 dark:border-red-500/50 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-500/10 text-red-900 dark:text-red-100';
    if (value >= low) return 'border-amber-300 dark:border-amber-500/50 focus:border-amber-500 focus:ring-amber-500/20 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-100';
    return 'border-zinc-300 dark:border-zinc-700 focus:ring-violet-500/20 focus:border-violet-500 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100';
}

function ThresholdHint({ value, low, high, unit }: { value: number; low: number; high: number; unit: string }) {
    if (value >= high) return (
        <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Très élevé — peut déclencher des alertes critiques
        </p>
    );
    if (value >= low) return (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1 font-medium">
            <AlertTriangle className="w-3.5 h-3.5" /> Modéré — des avertissements se déclencheront à ce niveau
        </p>
    );
    return (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 flex items-center gap-1">
            <Info className="w-3.5 h-3.5" /> Seuil conservateur — idéal pour économiser l&apos;énergie
        </p>
    );
}

// ── Tiered billing info modal ────────────────────────────────

const BILLING_TIERS = [
    { tranche: '1', range: '0 – 100 kWh',   type: 'Progressive', tarif: '0,9010', color: 'emerald' },
    { tranche: '2', range: '101 – 150 kWh',  type: 'Progressive', tarif: '1,0732', color: 'emerald' },
    { tranche: '3', range: '151 – 210 kWh',  type: 'Sélective',   tarif: '1,0732', color: 'amber' },
    { tranche: '4', range: '211 – 310 kWh',  type: 'Sélective',   tarif: '1,1676', color: 'amber' },
    { tranche: '5', range: '311 – 510 kWh',  type: 'Sélective',   tarif: '1,3817', color: 'orange' },
    { tranche: '6', range: '> 510 kWh',      type: 'Sélective',   tarif: '1,5958', color: 'red' },
];

function TieredBillingModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 h-full">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5 bg-gradient-to-r from-violet-500/5 to-transparent flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-500/15 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Système de Tarification à Tranches</h2>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Grille tarifaire TTC — Maroc</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    {/* Progressive section */}
                    <div className="rounded-xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Facturation Progressive (Tranches 1 &amp; 2)</p>
                        </div>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
                            Votre consommation est <strong>répartie proportionnellement</strong> sur les tranches franchies.
                            Vous ne payez que la part consommée dans chaque tranche — la méthode la plus avantageuse pour de petites consommations.
                        </p>
                    </div>

                    {/* Selective section */}
                    <div className="rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Facturation Sélective (Tranches 3 à 6)</p>
                        </div>
                        <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                            Dès que votre consommation dépasse <strong>150 kWh</strong> dans le mois,
                            <strong> toute la consommation</strong> est facturée au tarif de la tranche atteinte.
                            L&apos;avantage des premiers tarifs réduits disparaît complètement !
                        </p>
                    </div>

                    {/* Tariff table */}
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">Grille tarifaire (Taxes incluses)</p>
                        <div className="rounded-xl overflow-hidden border border-black/5 dark:border-white/5">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400">
                                        <th className="text-left px-3 py-2 font-semibold">Tranche</th>
                                        <th className="text-left px-3 py-2 font-semibold">Consommation</th>
                                        <th className="text-left px-3 py-2 font-semibold">Type</th>
                                        <th className="text-right px-3 py-2 font-semibold">MAD/kWh</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                    {BILLING_TIERS.map((t) => (
                                        <tr key={t.tranche} className="bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                                            <td className="px-3 py-2.5 font-bold text-zinc-700 dark:text-zinc-300">T{t.tranche}</td>
                                            <td className="px-3 py-2.5 text-zinc-600 dark:text-zinc-400 font-mono">{t.range}</td>
                                            <td className="px-3 py-2.5">
                                                <span className={cn(
                                                    'text-[10px] font-bold px-2 py-0.5 rounded-full',
                                                    t.color === 'emerald' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                                        : t.color === 'amber' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                                        : t.color === 'orange' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300'
                                                        : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                                                )}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-bold text-zinc-800 dark:text-zinc-200 font-mono">{t.tarif}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Tip */}
                    <div className="rounded-xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/5 p-4 flex items-start gap-3">
                        <Info className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-violet-700 dark:text-violet-300 leading-relaxed">
                            <strong>Conseil :</strong> Maintenir votre consommation sous <strong>150 kWh/mois</strong> vous garantit
                            la facturation progressive — la plus économique. Franchir ce seuil peut faire augmenter significativement votre facture.
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 px-6 py-3 border-t border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-800/30">
                    <button onClick={onClose} className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
                        Compris
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { updateSettings: updateStore, homes, selectedHomeId, selectHome, setHomes } = useSettingsStore();
    const { theme, setTheme } = useTheme();
    const [form, setForm] = useState<UserSettings>(() => defaultFormSettings());
    const [saving, setSaving] = useState(false);
    const [prefLoading, setPrefLoading] = useState(false);
    const [prefError, setPrefError] = useState('');
    const [useTieredBilling, setUseTieredBilling] = useState(false);
    const [showBillingModal, setShowBillingModal] = useState(false);

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
            toast.error('Veuillez sélectionner une résidence.');
            return;
        }
        setSaving(true);
        try {
            const created = await createPreferenceApi(selectedHomeId, form);
            setForm(created);
            updateStore(created);
            toast.success('Préférences sauvegardées avec succès.');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Échec de la sauvegarde des préférences.';
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
            {showBillingModal && <TieredBillingModal onClose={() => setShowBillingModal(false)} />}

            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Settings className="w-6 h-6 text-violet-500" />
                    Paramètres
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Préférences énergétiques par résidence — la sauvegarde crée un nouvel enregistrement de préférences.
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
                        Chargement des préférences de la résidence sélectionnée…
                    </p>
                )}

                {/* Seuils de Puissance */}
                <Section title="Seuils de Puissance" description="Définissez les niveaux d'alerte pour la surveillance de la puissance">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <FormField label="Seuil de puissance max. (W)" hint={
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

                        <FormField label="Seuil nocturne (W)" hint={
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

                {/* Tarification & Facturation */}
                <Section title="Tarification &amp; Facturation" description="Configurez le coût de l'électricité et la période de facturation">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                        <FormField label="Prix par kWh">
                            <input
                                type="number"
                                step="0.001"
                                min={0}
                                value={form.price_per_kwh}
                                {...field('price_per_kwh')}
                                className="w-full rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                            />
                        </FormField>
                        <FormField label="Devise">
                            <input
                                type="text"
                                maxLength={5}
                                value={form.currency}
                                {...field('currency')}
                                className="w-full rounded-lg px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-colors"
                                placeholder="MAD"
                            />
                        </FormField>
                        <FormField label="Jour de début de facturation (1–31)">
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

                    {/* Tiered billing switch */}
                    <label className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Facturation à Tranches</p>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setShowBillingModal(true); }}
                                        className="flex-shrink-0 p-0.5 rounded-full text-violet-500 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                                        title="En savoir plus sur la facturation à tranches"
                                    >
                                        <Info className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                    Système tarifaire progressif/sélectif selon la consommation mensuelle
                                </p>
                            </div>
                        </div>
                        <div
                            onClick={() => setUseTieredBilling((v) => !v)}
                            className={cn(
                                'relative w-11 h-6 rounded-full transition-colors cursor-pointer flex-shrink-0 ml-4',
                                useTieredBilling ? 'bg-violet-600' : 'bg-zinc-300 dark:bg-zinc-600'
                            )}
                        >
                            <span className={cn(
                                'absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform',
                                useTieredBilling ? 'translate-x-6' : 'translate-x-1'
                            )} />
                        </div>
                    </label>
                    {useTieredBilling && (
                        <p className="mt-2 text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1.5 px-1">
                            <Zap className="w-3.5 h-3.5" />
                            Facturation à tranches activée — la tarification progressive/sélective est prise en compte dans les estimations.
                        </p>
                    )}
                </Section>

                {/* Notifications */}
                <Section title="Notifications" description="Contrôlez le comportement des alertes et des notifications">
                    <label className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                        <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Activer les notifications</p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Alertes en temps réel et avertissements d&apos;anomalie</p>
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

                {/* Enregistrement de préférences */}
                <Section title="Enregistrement de préférences" description="Horodatage du dernier enregistrement chargé">
                    <div className="grid sm:grid-cols-2 gap-5">
                        <FormField label="Créé / dernier chargement">
                            <input
                                type="text"
                                readOnly
                                value={
                                    Number.isNaN(new Date(form.created_at).getTime())
                                        ? '—'
                                        : new Date(form.created_at).toLocaleString('fr-FR', {
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

                {/* Sauvegarder */}
                <div className="flex flex-col items-end gap-2 pt-2">
                    <button
                        type="submit"
                        disabled={saving || prefLoading || !selectedHomeId || homes.length === 0}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:hover:bg-violet-600 text-sm text-white font-medium transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-950"
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Sauvegarde…' : 'Sauvegarder les préférences'}
                    </button>
                    {!selectedHomeId && homes.length > 0 && (
                        <p className="text-xs text-zinc-500">Choisissez une résidence dans la liste ci-dessous ou dans la barre latérale.</p>
                    )}
                </div>
            </form>

            <hr className="my-8 border-zinc-200 dark:border-zinc-800" />

            {/* Apparence */}
            <Section title="Apparence" description="Choisissez votre thème de couleur préféré">
                <div className="grid grid-cols-3 gap-4">
                    {([
                        { value: 'dark', label: 'Sombre', icon: Moon },
                        { value: 'light', label: 'Clair', icon: Sun },
                        { value: 'system', label: 'Système', icon: Monitor },
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

            {/* Résidences */}
            <Section title="Résidences" description="Gérez vos propriétés surveillées">
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
                            Aucune résidence pour l&apos;instant. Ajoutez une résidence depuis la page Résidences &amp; Appareils.
                        </p>
                    )}
                </div>
            </Section>
        </div>
    );
}

// ── Sous-composants ──────────────────────────────────────────

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