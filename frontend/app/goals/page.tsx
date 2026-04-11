'use client';

import { useState } from 'react';
import { useGoalsStore } from '@/store/goalsStore';
import { postGoal, deleteGoal } from '@/lib/api';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ChartCard } from '@/components/ui/ChartCard';
import { calcProgress, cn } from '@/lib/utils';
import {
    Target, Plus, Trash2, X, Trophy, Zap, Star, Lock
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { Goal, GoalPeriod, GoalMetric } from '@/types';

// ── Gauge for efficiency score ──────────────────────────────

function EfficiencyGauge({ score }: { score: number }) {
    const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
    const label = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work';
    return (
        <div className="flex flex-col items-center py-4">
            <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                    <circle
                        cx="60" cy="60" r="50" fill="none"
                        stroke={color} strokeWidth="10"
                        strokeDasharray={`${Math.PI * 100 * score / 100} ${Math.PI * 100}`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black" style={{ color }}>{score}</span>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">/ 100</span>
                </div>
            </div>
            <p className="text-sm font-semibold mt-2" style={{ color }}>{label}</p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1">Energy Efficiency Score</p>
        </div>
    );
}

// ── Add Goal Modal ───────────────────────────────────────────

interface AddGoalModalProps {
    onClose: () => void;
    onAdd: (goal: Goal) => void;
}

function AddGoalModal({ onClose, onAdd }: AddGoalModalProps) {
    const [form, setForm] = useState<{
        label: string; metric: GoalMetric; period: GoalPeriod; target: string; unit: string;
    }>({ label: '', metric: 'energy', period: 'daily', target: '', unit: 'kWh' });

    const metricUnits: Record<GoalMetric, string> = { energy: 'kWh', cost: 'USD', power: 'W' };

    const handleMetricChange = (metric: GoalMetric) => {
        setForm((f) => ({ ...f, metric, unit: metricUnits[metric] }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const goal = await postGoal({
            label: form.label || `${form.period} ${form.metric} goal`,
            metric: form.metric,
            period: form.period,
            target: Number(form.target),
            current: 0,
            unit: form.unit,
        });
        onAdd(goal);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-white">Add New Goal</h3>
                    <button onClick={onClose} className="text-zinc-500 dark:text-zinc-400 hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">Label</label>
                        <input
                            value={form.label}
                            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                            placeholder="e.g. Keep daily usage under 12kWh"
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">Metric</label>
                            <select
                                value={form.metric}
                                onChange={(e) => handleMetricChange(e.target.value as GoalMetric)}
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            >
                                <option value="energy">Energy (kWh)</option>
                                <option value="cost">Cost (currency)</option>
                                <option value="power">Power (W)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">Period</label>
                            <select
                                value={form.period}
                                onChange={(e) => setForm((f) => ({ ...f, period: e.target.value as GoalPeriod }))}
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1 block">Target ({form.unit})</label>
                        <input
                            type="number"
                            min={1}
                            required
                            value={form.target}
                            onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        />
                    </div>
                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-black/10 dark:border-white/10 text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:text-zinc-200 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-colors shadow-lg shadow-violet-500/20">
                            Add Goal
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Main page ────────────────────────────────────────────────

export default function GoalsPage() {
    const { goals, achievements, efficiencyScore, totalXp, addGoal, removeGoal } = useGoalsStore();
    const [showAddModal, setShowAddModal] = useState(false);

    const handleAddGoal = (goal: Goal) => addGoal(goal);

    const handleDeleteGoal = (id: string) => {
        removeGoal(id);
        deleteGoal(id).catch(console.error);
    };

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Target className="w-5 h-5 text-violet-400" />
                        Goals & Gamification
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">Track your progress and earn achievements</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-all shadow-lg shadow-violet-500/20"
                >
                    <Plus className="w-3.5 h-3.5" />
                    New Goal
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Goals */}
                <div className="xl:col-span-2 space-y-3">
                    <h3 className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold">Active Goals</h3>
                    {goals.length === 0 ? (
                        <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-zinc-900/80 p-8 text-center">
                            <Target className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                            <p className="text-sm text-zinc-500 dark:text-zinc-400">No goals yet. Add your first goal!</p>
                        </div>
                    ) : (
                        goals.map((goal) => {
                            const pct = calcProgress(goal.current, goal.target);
                            const done = pct >= 100;
                            return (
                                <div key={goal.id} className={cn(
                                    'rounded-2xl border p-4 transition-all',
                                    done ? 'border-emerald-500/20 bg-emerald-500/5' : ' bg-white  border-gray-200 shadow-sm rounded-xl   dark:border-black/5 dark:border-white/5 dark:bg-zinc-900/80'
                                )}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {done && <Star className="w-3.5 h-3.5 text-emerald-400" />}
                                                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{goal.label}</p>
                                            </div>
                                            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 capitalize">{goal.period} · {goal.metric}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                                                done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                                            )}>
                                                {done ? '✓ Done' : goal.period}
                                            </span>
                                            <button onClick={() => handleDeleteGoal(goal.id)} className="text-zinc-600 hover:text-red-400 transition-colors">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <ProgressBar
                                        value={goal.current}
                                        max={goal.target}
                                        label={`${goal.current} / ${goal.target} ${goal.unit}`}
                                        showLabel={false}
                                        showValue={true}
                                        lowerIsBetter={true}
                                        size="md"
                                    />
                                </div>
                            );
                        })
                    )}

                    {/* Achievements */}
                    <h3 className="text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 font-semibold pt-2">Achievements</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {achievements.map((ach) => {
                            const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[ach.icon] || Trophy;
                            return (
                                <div key={ach.id} className={cn(
                                    'rounded-2xl border p-4 text-center transition-all',
                                    ach.unlocked
                                        ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5'
                                        : 'bg-gray-50 border border-gray-200 dark:border-black/5 dark:border-white/5 dark:bg-zinc-100/50 dark:bg-zinc-900/50 opacity-60'
                                )}>
                                    <div className={cn(
                                        'w-12 h-12 rounded-2xl mx-auto mb-2 flex items-center justify-center',
                                        ach.unlocked ? 'bg-amber-500/20' : 'bg-zinc-100 dark:bg-zinc-800'
                                    )}>
                                        {ach.unlocked
                                            ? <Icon className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                                            : <Lock className="w-5 h-5 text-gray-400 dark:text-zinc-600" />
                                        }
                                    </div>
                                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{ach.name}</p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">{ach.description}</p>
                                    <div className={cn(
                                        'mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block',
                                        ach.unlocked ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500'
                                    )}>
                                        +{ach.xp} XP
                                    </div>
                                    {!ach.unlocked && ach.progress != null && (
                                        <div className="mt-2 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-violet-500 rounded-full" style={{ width: `${ach.progress}%` }} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right: gauge + XP */}
                <div className="space-y-3">
                    <ChartCard title="Efficiency Score">
                        <EfficiencyGauge score={efficiencyScore} />
                    </ChartCard>

                    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-indigo-900/10 p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 dark:text-violet-400 text-purple-700" />
                            <p className="text-sm font-semibold text-purple-700  dark:text-zinc-100">Total XP</p>
                        </div>
                        <p className="text-4xl text-purple-600 font-black dark:text-violet-300">{totalXp}</p>
                        <div className="mt-3 text-[11px] text-purple-800 dark:text-zinc-500 dark:text-zinc-400 space-y-1">
                            <p>✓ {achievements.filter(a => a.unlocked).length} achievements unlocked</p>
                            <p>⬜ {achievements.filter(a => !a.unlocked).length} achievements remaining</p>
                        </div>
                    </div>
                </div>
            </div>

            {showAddModal && (
                <AddGoalModal
                    onClose={() => setShowAddModal(false)}
                    onAdd={handleAddGoal}
                />
            )}
        </div>
    );
}
