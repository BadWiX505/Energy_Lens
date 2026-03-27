'use client';

import { useEffect, useState, useCallback } from 'react';
import { useEnergyStore } from '@/store/energyStore';
import { useEnergy } from '@/hooks/useEnergy';
import { useSocket } from '@/hooks/useSocket';
import { useSettingsStore } from '@/store/settingsStore';
import { getEnergyHistory } from '@/lib/api';
import { generateComparisonData, predictMonthlyBill, ENERGY_BREAKDOWN } from '@/lib/mockData';
import { MetricCard } from '@/components/ui/MetricCard';
import { ChartCard } from '@/components/ui/ChartCard';
import { EnergyAreaChart } from '@/components/ui/AreaChart';
import { EnergyBarChart } from '@/components/ui/BarChart';
import { EnergyPieChart } from '@/components/ui/PieChart';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { MonitoringMode } from '@/types';
import { Activity, Zap, TrendingUp, DollarSign, Bolt, Calendar } from 'lucide-react';

const MODES: { value: MonitoringMode; label: string }[] = [
  { value: 'live', label: 'Live' },
  { value: 'hours', label: 'Hourly' },
  { value: 'days', label: 'Daily' },
  { value: 'weeks', label: 'Weekly' },
  { value: 'months', label: 'Monthly' },
];

export default function DashboardPage() {
  const { metrics, history } = useEnergy();
  const { connected } = useSocket();
  const { monitoringMode, groupedHistory, setMonitoringMode, setGroupedHistory, setLoading, isLoading } = useEnergyStore();
  const { settings } = useSettingsStore();

  const [compData, setCompData] = useState(generateComparisonData());
  const [billPrediction] = useState(() => predictMonthlyBill(settings.price_per_kwh));

  // Load grouped history when mode changes
  useEffect(() => {
    if (monitoringMode === 'live') return;
    setLoading(true);
    getEnergyHistory(monitoringMode)
      .then(setGroupedHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [monitoringMode, setGroupedHistory, setLoading]);

  const handleModeChange = useCallback((mode: MonitoringMode) => {
    setMonitoringMode(mode);
  }, [setMonitoringMode]);

  const displayMetrics = metrics ?? {
    power: 0, voltage: 0, current: 0, energy: 0, cost: 0, timestamp: '',
  };

  // Chart data for live mode
  const liveChartData = history.map((h) => ({
    label: h.label,
    'Power (W)': h.power,
    'Voltage (V)': h.voltage,
    'Current (A)': h.current,
    'Energy (kWh)': h.energy,
  }));

  return (
    <div className="space-y-6 pb-8">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Energy Overview</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Real-time monitoring · {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
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
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 hover:bg-black/5 dark:bg-white/5'
                  }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          title="Power"
          value={formatNumber(displayMetrics.power, 0)}
          unit="W"
          icon="Zap"
          color="violet"
          change={displayMetrics.power > (settings.max_power_threshold * 0.7) ? 12 : -5}
        />
        <MetricCard
          title="Voltage"
          value={formatNumber(displayMetrics.voltage, 1)}
          unit="V"
          icon="Activity"
          color="cyan"
        />
        <MetricCard
          title="Current"
          value={formatNumber(displayMetrics.current, 2)}
          unit="A"
          icon="Cpu"
          color="amber"
        />
        <MetricCard
          title="Energy"
          value={formatNumber(displayMetrics.energy, 3)}
          unit="kWh"
          icon="BarChart2"
          color="emerald"
          className="col-span-1"
        />
        <MetricCard
          title="Cost"
          value={formatNumber(displayMetrics.cost * 100, 3)}
          unit={settings.currency + "¢"}
          icon="DollarSign"
          color="rose"
          subtitle={`@${settings.price_per_kwh}/kWh`}
          className="col-span-1"
        />
      </div>

      {/* Charts */}
      {monitoringMode === 'live' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <ChartCard
            title="Power & Energy — Live"
            subtitle={`${history.length} data points`}
            action={<span className="text-[10px] text-zinc-400 dark:text-zinc-500">Updates every 2s</span>}
          >
            <EnergyAreaChart
              data={liveChartData}
              dataKeys={[
                { key: 'Power (W)', color: '#8b5cf6', label: 'Power (W)' },
              ]}
              height={220}
            />
          </ChartCard>
          <ChartCard
            title="Voltage & Current — Live"
            subtitle="Real-time electrical parameters"
          >
            <EnergyAreaChart
              data={liveChartData}
              dataKeys={[
                { key: 'Voltage (V)', color: '#06b6d4', label: 'Voltage (V)' },
                { key: 'Current (A)', color: '#f59e0b', label: 'Current (A)' },
              ]}
              height={220}
            />
          </ChartCard>
        </div>
      ) : (
        <>
          {/* Grouped: single area chart */}
          <ChartCard
            title={`Energy Consumption — ${MODES.find(m => m.value === monitoringMode)?.label}`}
            subtitle={`${groupedHistory.length} periods`}
          >
            <EnergyAreaChart
              data={groupedHistory}
              dataKeys={[
                { key: 'energy', color: '#8b5cf6', label: 'Energy (kWh)' },
                { key: 'power', color: '#06b6d4', label: 'Power (W)' },
              ]}
              height={260}
            />
          </ChartCard>

          {/* Comparison + Breakdown */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard
              title="Today vs Yesterday"
              subtitle="Energy comparison (kWh)"
            >
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
              title="Consumption Breakdown"
              subtitle="By appliance category"
            >
              <EnergyPieChart data={ENERGY_BREAKDOWN} height={260} />
            </ChartCard>
          </div>
        </>
      )}

      {/* Bill prediction + stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2 rounded-2xl border border-violet-500/10 bg-gradient-to-br from-violet-900/20 to-indigo-900/10 p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Calendar className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Monthly Bill Prediction</h4>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{billPrediction.daysLeft} days remaining this month</p>
            </div>
          </div>
          <div className="flex items-end gap-6">
            <div>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5">Projected</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(billPrediction.projected, settings.currency)}</p>
            </div>
            <div className="pb-1">
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-0.5">Last Month</p>
              <p className="text-lg font-semibold text-zinc-700 dark:text-zinc-300">{formatCurrency(billPrediction.lastMonth, settings.currency)}</p>
              <p className={`text-[10px] font-medium ${billPrediction.projected > billPrediction.lastMonth ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                {billPrediction.projected > billPrediction.lastMonth ? '↑' : '↓'}{' '}
                {Math.abs(((billPrediction.projected - billPrediction.lastMonth) / billPrediction.lastMonth) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Avg daily usage: <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{billPrediction.avgDaily} kWh</span> ·{' '}
              At <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{settings.price_per_kwh} {settings.currency}/kWh</span>
            </p>
          </div>
        </div>

        {/* Quick stats */}
        {[
          { label: 'Today\'s Usage', value: `${(billPrediction.avgDaily * 0.4).toFixed(1)} kWh`, icon: 'Zap', color: 'text-violet-400' },
          { label: 'Peak Power Today', value: '2,847 W', icon: 'TrendingUp', color: 'text-rose-400' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-black/5 dark:border-white/5 bg-zinc-900/80 p-5 flex flex-col justify-between">
            <p className="text-[11px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-2`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
