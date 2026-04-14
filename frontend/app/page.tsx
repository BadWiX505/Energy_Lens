'use client';

import { useEffect, useState, useCallback } from 'react';
import { useEnergyStore } from '@/store/energyStore';
import { useEnergyLiveData } from '@/hooks/useEnergyLiveData';
import { useSocket } from '@/hooks/useSocket';
import { useSettingsStore } from '@/store/settingsStore';
import { getEnergyHistory, getEnergySummary, getEnergyComparison } from '@/lib/api';
import { MetricCard } from '@/components/ui/MetricCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { EnergyAreaChart } from '@/components/ui/AreaChart';
import { EnergyBarChart } from '@/components/ui/BarChart';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { DeviceSelector } from '@/components/ui/DeviceSelector';
import { TipsCard } from '@/components/ui/TipsCard';
import { formatNumber } from '@/lib/utils';
import type { MonitoringMode, EnergySummary, ComparisonData } from '@/types';
import { AlertCircle, Loader } from 'lucide-react';

const MODES: { value: MonitoringMode; label: string }[] = [
  { value: 'live', label: 'Temps réel' },
  { value: 'hours', label: 'Horaire' },
  { value: 'days', label: 'Journalier' },
  { value: 'weeks', label: 'Hebdo' },
  { value: 'months', label: 'Mensuel' },
];

const EMPTY_SUMMARY: EnergySummary = {
  today: { energy: 0, cost: 0, peak: 0 },
  thisWeek: { energy: 0, cost: 0, avgDaily: 0 },
  thisMonth: { energy: 0, cost: 0, projectedFull: 0, daysRemaining: 0 },
  lastMonth: { energy: 0, cost: 0 },
  billingCycle: {
    energy: 0,
    cost: 0,
    projectedEnergy: 0,
    projectedCost: 0,
    avgDailyEnergy: 0,
    avgDailyCost: 0,
    daysElapsed: 0,
    daysRemaining: 0,
    totalDays: 0,
    startDate: new Date(0).toISOString(),
    endDate: new Date(0).toISOString(),
    previousEnergy: 0,
    previousCost: 0,
  },
  trend: 'stable',
  trendPercent: 0,
};

export default function DashboardPage() {
  const { connected } = useSocket();
  const {
    monitoringMode, metrics, history, groupedHistory, selectedDeviceId,
    setMonitoringMode, setGroupedHistory, setLoading, isLoading,
  } = useEnergyStore();
  const { settings } = useSettingsStore();

  // Subscribe to real-time energy data for selected device (Live mode only)
  useEnergyLiveData(monitoringMode === 'live' ? selectedDeviceId : null);

  // Non-live state: summary and comparison from the API
  const [summary, setSummary] = useState<EnergySummary>(EMPTY_SUMMARY);
  const [compData, setCompData] = useState<ComparisonData[]>([]);

  // ── Fetch all grouped data when mode/device changes ─────────────
  useEffect(() => {
    if (monitoringMode === 'live' || !selectedDeviceId) return;

    setLoading(true);

    Promise.all([
      getEnergyHistory(selectedDeviceId, monitoringMode as 'hours' | 'days' | 'weeks' | 'months'),
      getEnergySummary(selectedDeviceId),
      getEnergyComparison(selectedDeviceId),
    ])
      .then(([historyData, summaryData, comparisonData]) => {
        setGroupedHistory(historyData);
        setSummary(summaryData);
        setCompData(comparisonData);
      })
      .catch((err) => {
        console.error('[Dashboard] Failed to fetch grouped data:', err);
        setGroupedHistory([]);
        setSummary(EMPTY_SUMMARY);
        setCompData([]);
      })
      .finally(() => setLoading(false));
  }, [monitoringMode, selectedDeviceId, setGroupedHistory, setLoading]);

  const handleModeChange = useCallback((mode: MonitoringMode) => {
    setMonitoringMode(mode);
  }, [setMonitoringMode]);

  useEffect(() => {
    console.log({ summary });
  }, [summary]);
  // In Live mode: show real WebSocket data
  // In other modes: show summary data from API
  const displayMetrics = monitoringMode === 'live'
    ? (metrics ?? { power: 0, voltage: 0, current: 0, energy: 0, cost: 0, timestamp: '' })
    : {
        power: summary.today.peak,
        voltage: 0,
        current: 0,
        energy: summary.today.energy,
        cost: summary.today.cost,
        timestamp: '',
      };

  // Chart data: real data for Live mode
  const liveChartData = history.map((h) => ({
    label: h.label,
    'Power': h.power,
    'Voltage': h.voltage,
    'Current': h.current,
    'Energy': h.energy,
  }));
  const projectedBillChange = summary.billingCycle.previousCost > 0
    ? Number((((summary.billingCycle.projectedCost - summary.billingCycle.previousCost) / summary.billingCycle.previousCost) * 100).toFixed(1))
    : undefined;
  const billingCycleSubtitle = summary.billingCycle.daysRemaining > 0
    ? `${summary.billingCycle.daysRemaining} j. restants dans le cycle`
    : 'Le cycle de facturation se clôture aujourd’hui';

  return (
    <div className="space-y-6 pb-8">
      {/* Connection status and data state for Live mode */}
      {monitoringMode === 'live' && (
        <>
          {!connected && (
            <div className="rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-3 flex items-gap-2 gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Connexion non établie</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-500">Connexion à votre environnement en cours…</p>
              </div>
            </div>
          )}
          {!metrics && (
            <div className="rounded-lg border border-blue-500/50 bg-blue-50 dark:bg-blue-950/20 p-4 flex items-gap-3 gap-3">
              <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">En attente des données…</p>
                <p className="text-xs text-blue-600 dark:text-blue-500">Aucune mesure reçue pour le moment. Vérifiez que votre appareil est actif.</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading indicator for grouped data (non-Live modes) */}
      {isLoading && monitoringMode !== 'live' && (
        <div className="rounded-lg border border-blue-500/50 bg-blue-50 dark:bg-blue-950/20 p-4 flex items-gap-3 gap-3">
          <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5 animate-spin" />
          <div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Chargement des données…</p>
            <p className="text-xs text-blue-600 dark:text-blue-500">Récupération des données {MODES.find(m => m.value === monitoringMode)?.label.toLowerCase()}</p>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Vue d’ensemble énergétique</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Surveillance en temps réel · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <ConnectionStatus connected={connected} />
            {/* Mode tabs */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 rounded-xl p-1 border border-black/5 dark:border-white/5">
              {MODES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleModeChange(value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 ${monitoringMode === value
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200  dark:hover:text-zinc-200  hover:bg-black/5 dark:bg-white/5 dark:hover:bg-violet-500/20'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Device selector - shown in all modes */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Appareil :</span>
          <DeviceSelector />
        </div>
      </div>

      {/* ── Tips card ──────────────────────────────────────────── */}

      {/* ── Metric cards ───────────────────────────────────────── */}
      {monitoringMode === 'live' ? (
        metrics ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <MetricCard title="Puissance" value={formatNumber(displayMetrics.power, 0)} unit="W" icon="Zap" color="violet"
              change={displayMetrics.power > (settings.max_power_threshold * 0.7) ? 12 : -5} />
            <MetricCard title="Tension" value={formatNumber(displayMetrics.voltage, 1)} unit="V" icon="Activity" color="cyan" />
            <MetricCard title="Intensité" value={formatNumber(displayMetrics.current, 2)} unit="A" icon="Cpu" color="amber" />
            <MetricCard title="Énergie" value={formatNumber(displayMetrics.energy, 3)} unit="kWh" icon="BarChart2" color="emerald" />
            <MetricCard title="Coût" value={formatNumber(displayMetrics.cost, 4)} unit={settings.currency} icon="DollarSign" color="rose"
              subtitle={`@${settings.price_per_kwh}/kWh`} />
          </div>
        ) : null
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricCard title="Énergie du jour" value={formatNumber(summary.today.energy, 2)} unit="kWh" icon="Zap" color="violet" />
          <MetricCard title="Coût du jour" value={formatNumber(summary.today.cost, 2)} unit={settings.currency} icon="DollarSign" color="rose" />
          <MetricCard title="Pic de puissance" value={formatNumber(summary.today.peak, 0)} unit="W" icon="TrendingUp" color="amber" />
          <MetricCard title="Énergie semaine" value={formatNumber(summary.thisWeek.energy, 2)} unit="kWh" icon="BarChart2" color="emerald" />
          <MetricCard title="Énergie mois" value={formatNumber(summary.thisMonth.energy, 2)} unit="kWh" icon="Activity" color="cyan"
            change={summary.trendPercent !== 0 ? summary.trendPercent : undefined}
            subtitle={`${summary.trend === 'up' ? '↑' : summary.trend === 'down' ? '↓' : '→'} vs mois précédent`} />
          <MetricCard title="Facture estimée" value={formatNumber(summary.billingCycle.projectedCost, 2)} unit={settings.currency} icon="Wallet" color="sky"
            change={projectedBillChange}
            subtitle={billingCycleSubtitle} />
        </div>
      )}

      {/* ── Charts ─────────────────────────────────────────────── */}
      {monitoringMode === 'live' ? (
        metrics ? (
          <div className="grid grid-cols-2  grid-rows-2 gap-4">
             <div className="lg:col-span-1 lg:row-span-2">
              <TipsCard  mode={monitoringMode}/>
            </div>
            <ChartCard
              title="Puissance & Énergie — Temps réel"
              subtitle={`${liveChartData.length} point${liveChartData.length === 1 ? '' : 's'} de données`}
              action={<span className="text-[10px] text-zinc-400 dark:text-zinc-500">Mises à jour en direct</span>}
              className='col-span-1 row-span-1'
            >
              <EnergyAreaChart
                data={liveChartData}
                dataKeys={[{ key: 'Power', color: '#8b5cf6', label: 'Power (W)' }]}
                height={220}
              />
            </ChartCard>
            <ChartCard title="Tension & Intensité — Temps réel" subtitle="Paramètres électriques en direct" className='col-span-1 row-span-1'>
              <EnergyAreaChart
                data={liveChartData}
                dataKeys={[
                  { key: 'Voltage', color: '#06b6d4', label: 'Voltage (V)' },
                  { key: 'Current', color: '#f59e0b', label: 'Current (A)' },
                ]}
                className='h-full'
                height={250}
              />
            </ChartCard>
          </div>
        ) : null
      ) : (
        <>
          {/* TipsCard + Main chart — side by side, tips wider */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-stretch">
            <div className="lg:col-span-3">
              <TipsCard mode={monitoringMode}/>
            </div>
            <div className="lg:col-span-2">
              <ChartCard
              title={`Consommation énergétique — ${MODES.find(m => m.value === monitoringMode)?.label}`}
              subtitle={`${groupedHistory.length} période${groupedHistory.length !== 1 ? 's' : ''}`}
                className="h-full"
              >
                <EnergyAreaChart
                  data={groupedHistory}
                  dataKeys={[
                    { key: 'energy', color: '#8b5cf6', label: 'Energy (kWh)' },
                    { key: 'power', color: '#06b6d4', label: 'Avg Power (W)' },
                  ]}
                  height={260}
                />
              </ChartCard>
            </div>
          </div>

          {/* Comparison + Cost */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard title="Aujourd’hui vs Hier" subtitle="Comparaison horaire de consommation (kWh)">
              <EnergyBarChart
                data={compData}
                dataKeys={[
                  { key: 'today', color: '#8b5cf6', label: 'Today (kWh)' },
                  { key: 'yesterday', color: '#06b6d4', label: 'Yesterday (kWh)' },
                ]}
                height={240}
              />
            </ChartCard>
            <ChartCard
              title={`Évolution des coûts — ${MODES.find((mode) => mode.value === monitoringMode)?.label}`}
              subtitle={`${groupedHistory.length} période${groupedHistory.length !== 1 ? 's' : ''} · ${settings.currency}`}
            >
              <EnergyAreaChart
                data={groupedHistory}
                dataKeys={[
                  { key: 'cost', color: '#f43f5e', label: `Cost (${settings.currency})` },
                ]}
                height={240}
              />
            </ChartCard>
          </div>

          <ChartCard
            title="Facture estimée"
            subtitle={`Cycle de facturation en cours · débuté le ${new Date(summary.billingCycle.startDate).toLocaleDateString('fr-FR')}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <MetricCard title="Coût prévisionnel" value={formatNumber(summary.billingCycle.projectedCost, 2)} unit={settings.currency} icon="Wallet" color="sky" change={projectedBillChange} subtitle={billingCycleSubtitle} />
              <MetricCard title="Coût actuel" value={formatNumber(summary.billingCycle.cost, 2)} unit={settings.currency} icon="DollarSign" color="rose" subtitle={`${formatNumber(summary.billingCycle.daysElapsed, 1)} j. écoulés`} />
              <MetricCard title="Énergie prévisionnelle" value={formatNumber(summary.billingCycle.projectedEnergy, 2)} unit="kWh" icon="BarChart2" color="emerald" subtitle={`${formatNumber(summary.billingCycle.avgDailyEnergy, 2)} kWh/jour`} />
              <MetricCard title="Cycle précédent" value={formatNumber(summary.billingCycle.previousCost, 2)} unit={settings.currency} icon="History" color="amber" subtitle={summary.billingCycle.totalDays > 0 ? `Cycle de ${formatNumber(summary.billingCycle.totalDays, 0)} j.` : undefined} />
            </div>
          </ChartCard>
        </>
      )}

      {/* ── Quick stats — non-Live only ────────────────────────── */}
      {monitoringMode !== 'live' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Consommation du jour', value: `${formatNumber(summary.today.energy, 2)} kWh`, color: 'text-violet-400' },
            { label: 'Coût quotidien moyen', value: `${formatNumber(summary.billingCycle.avgDailyCost, 2)} ${settings.currency}`, color: 'text-rose-400' },
            { label: 'Jours restants', value: `${summary.billingCycle.daysRemaining} j.`, color: 'text-sky-400' },
            { label: 'Énergie cycle préc.', value: `${formatNumber(summary.billingCycle.previousEnergy, 2)} kWh`, color: 'text-emerald-400' },
          ].map((stat, i) => (
            <div key={i} className="rounded-2xl border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900/80 p-5 flex flex-col justify-between">
              <p className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{stat.label}</p>
              <p className={`text-2xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
