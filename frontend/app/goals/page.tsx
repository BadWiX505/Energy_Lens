'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useGoalsStore } from '@/store/goalsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { getGoals, getAchievements, postGoal, deleteGoal, markScoreRead, markAchievementRead } from '@/lib/api';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ChartCard } from '@/components/ui/ChartCard';
import { calcProgress, cn } from '@/lib/utils';
import {
    Target, Plus, Trash2, X, Trophy, Zap, Star, Lock,
    ShoppingBag, Check, Users, Calendar, AlertTriangle,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { Goal, GoalPeriod, GoalMetric, Achievement, EnergyScore } from '@/types';

// ── Reward store items (frontend-only, no backend) ───────────

const REWARD_ITEMS = [
    { id: 'r1', emoji: '🟢', name: 'Green Avatar Badge', description: 'Show off your eco-friendly profile badge', cost: 50, category: 'Profile' },
    { id: 'r2', emoji: '👕', name: 'Energy Saver T-Shirt', description: 'Exclusive Energy Lens branded tee — shipped to your door', cost: 200, category: 'Merch' },
    { id: 'r3', emoji: '💸', name: '5% Bill Discount', description: 'Redeem for a discount voucher on your next electricity bill', cost: 150, category: 'Discount' },
    { id: 'r4', emoji: '🖼️', name: 'Eco Warrior Frame', description: 'Special profile picture border — stand out in the community', cost: 80, category: 'Profile' },
    { id: 'r5', emoji: '🏷️', name: 'Partner Promo Code', description: 'Exclusive discount code from our energy-saving partners', cost: 120, category: 'Promo' },
    { id: 'r6', emoji: '✨', name: 'Solar Sticker Pack', description: 'Fun digital sticker collection for your profile', cost: 40, category: 'Profile' },
    { id: 'r7', emoji: '🔌', name: 'Smart Plug Voucher', description: '$10 off a smart plug at select partner stores', cost: 300, category: 'Discount' },
    { id: 'r8', emoji: '🎨', name: 'Premium Theme', description: 'Unlock a custom dashboard color theme — dark or light', cost: 100, category: 'Profile' },
];

// ── Validation max values ────────────────────────────────────

const MAX_TARGETS: Record<GoalPeriod, Record<GoalMetric, number>> = {
    daily:   { energy: 500,   cost: 500,   power: 50000 },
    weekly:  { energy: 3500,  cost: 3500,  power: 50000 },
    monthly: { energy: 15000, cost: 15000, power: 50000 },
};

// ── Score gauge ───────────────────────────────────────────────

function EfficiencyGauge({ score }: { score: number }) {
    const capped = Math.min(score, 500);
    const pct = Math.min((capped / 500) * 100, 100);
    const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#6366f1';
    const label = pct >= 80 ? 'Excellent' : pct >= 50 ? 'Good' : 'Growing';
    return (
        <div className="flex flex-col items-center py-4">
            <div className="relative w-36 h-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={color} strokeWidth="10"
                        strokeDasharray={`${Math.PI * 100 * pct / 100} ${Math.PI * 100}`}
                        strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black" style={{ color }}>{score}</span>
                    <span className="text-[10px] text-zinc-500">pts</span>
                </div>
            </div>
            <p className="text-sm font-semibold mt-2" style={{ color }}>{label}</p>
            <p className="text-[11px] text-zinc-400 mt-1">Total Score</p>
        </div>
    );
}

// ── Add Goal Modal ────────────────────────────────────────────

interface AddGoalModalProps { homeId: string; onClose: () => void; onAdd: (goal: Goal) => void; }

function AddGoalModal({ homeId, onClose, onAdd }: AddGoalModalProps) {
    const [form, setForm] = useState<{ label: string; metric: GoalMetric; period: GoalPeriod; target: string; duration: string; }>(
        { label: '', metric: 'energy', period: 'daily', target: '', duration: '1' }
    );
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const metricUnits: Record<GoalMetric, string> = { energy: 'kWh', cost: 'currency', power: 'W' };
    const periodLabel: Record<GoalPeriod, string> = { daily: 'day(s)', weekly: 'week(s)', monthly: 'month(s)' };

    const computedEndDate = (() => {
        const d = parseInt(form.duration, 10);
        if (!d || d < 1) return null;
        const ms = { daily: 86400000, weekly: 7 * 86400000, monthly: 30 * 86400000 }[form.period];
        return new Date(Date.now() + d * ms);
    })();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const val = Number(form.target);
        const dur = Number(form.duration);
        const max = MAX_TARGETS[form.period][form.metric];
        if (val <= 0) { setError('Target must be greater than 0'); return; }
        if (val > max) { setError(`Max for ${form.period} ${form.metric}: ${max.toLocaleString()}`); return; }
        if (dur < 1 || dur > 365) { setError('Duration must be between 1 and 365'); return; }
        setLoading(true);
        try {
            const goal = await postGoal({ homeId, type: form.period, targetValue: val, targetMetric: form.metric, duration: dur, label: form.label || undefined });
            onAdd(goal);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create goal');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Add New Goal</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-[11px] text-zinc-500 mb-1 block">Label (optional)</label>
                        <input value={form.label} onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                            placeholder="e.g. Keep daily usage under 10 kWh"
                            className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-zinc-500 mb-1 block">Metric</label>
                            <select value={form.metric} onChange={(e) => setForm(f => ({ ...f, metric: e.target.value as GoalMetric }))}
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500">
                                <option value="energy">Energy (kWh)</option>
                                <option value="cost">Cost (currency)</option>
                                <option value="power">Power (W)</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] text-zinc-500 mb-1 block">Period type</label>
                            <select value={form.period} onChange={(e) => setForm(f => ({ ...f, period: e.target.value as GoalPeriod }))}
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500">
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[11px] text-zinc-500 mb-1 block">
                                Target ({metricUnits[form.metric]}) — max {MAX_TARGETS[form.period][form.metric].toLocaleString()}
                            </label>
                            <input type="number" min={1} max={MAX_TARGETS[form.period][form.metric]} required
                                value={form.target} onChange={(e) => setForm(f => ({ ...f, target: e.target.value }))}
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                        </div>
                        <div>
                            <label className="text-[11px] text-zinc-500 mb-1 block">Duration ({periodLabel[form.period]})</label>
                            <input type="number" min={1} max={365} required
                                value={form.duration} onChange={(e) => setForm(f => ({ ...f, duration: e.target.value }))}
                                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-violet-500" />
                        </div>
                    </div>
                    {computedEndDate && (
                        <p className="text-[11px] text-zinc-400 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-violet-400" />
                            Goal ends: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{computedEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                        </p>
                    )}
                    {error && <p className="text-[11px] text-red-400">{error}</p>}
                    <div className="flex gap-2 pt-1">
                        <button type="button" onClick={onClose} className="flex-1 py-2 rounded-xl border border-black/10 dark:border-white/10 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-xs text-white font-semibold transition-colors shadow-lg shadow-violet-500/20">
                            {loading ? 'Saving\u2026' : 'Add Goal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Score History ─────────────────────────────────────────────

function ScoreHistoryBox({ scores }: { scores: EnergyScore[] }) {
    if (scores.length === 0) return <p className="text-xs text-zinc-500 text-center py-4">No score history yet. Complete goals to earn points!</p>;
    return (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
            {scores.map((s) => {
                const dt = new Date(s.date);
                const dateStr = isNaN(dt.getTime()) ? '' : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const reason = s.label ?? (s.type === 'achievement' ? 'Achievement unlocked' : 'Goal completed');
                return (
                    <div key={s.id} className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/60">
                        <div className="flex items-center gap-2 min-w-0">
                            {s.type === 'goal' ? <Target className="w-3 h-3 text-violet-400 shrink-0" /> : <Trophy className="w-3 h-3 text-amber-400 shrink-0" />}
                            <span className="text-zinc-600 dark:text-zinc-400 truncate">{reason}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                            <span className="text-zinc-400">{dateStr}</span>
                            <span className="font-bold text-violet-600 dark:text-violet-400">+{s.score} pts</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ── Community Comparison ──────────────────────────────────────

function CommunityComparisonCard({ yourScore, avgScore, topScore, totalHomes, yourPercentile }: {
    yourScore: number; avgScore: number; topScore: number; totalHomes: number; yourPercentile: number;
}) {
    const maxBar = Math.max(topScore, 1);
    const bars = [
        { label: 'You', value: yourScore, color: 'bg-violet-500' },
        { label: 'Average', value: avgScore, color: 'bg-zinc-400' },
        { label: 'Top', value: topScore, color: 'bg-amber-400' },
    ];
    return (
        <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <Users className="w-3 h-3" />
                <span>Among {totalHomes} home{totalHomes !== 1 ? 's' : ''} &middot; You beat {yourPercentile}% of users</span>
            </div>
            <div className="space-y-2">
                {bars.map((b) => (
                    <div key={b.label} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                            <span className="text-zinc-500">{b.label}</span>
                            <span className="font-semibold text-zinc-700 dark:text-zinc-300">{b.value} pts</span>
                        </div>
                        <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all duration-700', b.color)}
                                style={{ width: `${Math.round((b.value / maxBar) * 100)}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Celebration Popup ─────────────────────────────────────────

function CelebrationPopup({ newScores, newAchievements, onDismiss }: {
    newScores: EnergyScore[]; newAchievements: Achievement[]; onDismiss: () => void;
}) {
    const totalPts = newScores.reduce((s, sc) => s + sc.score, 0) + newAchievements.reduce((s, a) => s + a.xp, 0);

    const handleDismiss = async () => {
        // Fire-and-forget: mark all as read before clearing state
        await Promise.allSettled([
            ...newScores.map(s => markScoreRead(s.id)),
            ...newAchievements.map(a => a.userAchievementId ? markAchievementRead(a.userAchievementId) : Promise.resolve()),
        ]);
        onDismiss();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center overflow-hidden pointer-events-none">
                {[...Array(10)].map((_, i) => (
                    <div key={i} className="absolute rounded-full border-2 celebrate-ring"
                        style={{ width: `${60 + i * 35}px`, height: `${60 + i * 35}px`, animationDelay: `${i * 90}ms`,
                            borderColor: ['#6366f1','#10b981','#f59e0b','#ec4899'][i % 4] }} />
                ))}
            </div>
            <div className="relative z-10 w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-violet-500/30 shadow-2xl shadow-violet-500/20 p-6 text-center">
                <div className="text-4xl mb-2">🎉</div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white mb-1">+{totalPts} Points Earned!</h3>
                <p className="text-xs text-zinc-500 mb-4">Keep up the great work on your energy goals!</p>
                <div className="space-y-1">
                    {newScores.map(s => (
                        <div key={s.id} className="flex items-center justify-between text-xs bg-violet-500/10 rounded-xl px-3 py-2">
                            <span className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300"><Target className="w-3 h-3" /> Goal Completed</span>
                            <span className="font-bold text-violet-600 dark:text-violet-400">+{s.score} pts</span>
                        </div>
                    ))}
                    {newAchievements.map(a => (
                        <div key={a.id} className="flex items-center justify-between text-xs bg-amber-500/10 rounded-xl px-3 py-2">
                            <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300"><Trophy className="w-3 h-3" /> {a.name}</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">+{a.xp} pts</span>
                        </div>
                    ))}
                </div>
                <button onClick={handleDismiss} className="mt-4 w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm text-white font-semibold transition-colors">
                    <Check className="w-4 h-4 inline mr-1.5" /> Got it!
                </button>
            </div>
            <style>{`
                @keyframes celebrate-ring { 0% { transform: scale(0); opacity: 0.8; } 100% { transform: scale(1.6); opacity: 0; } }
                .celebrate-ring { animation: celebrate-ring 1.3s ease-out forwards; }
            `}</style>
        </div>
    );
}

// ── Reward Store Dialog (row layout) ──────────────────────────

function RewardStoreDialog({ totalScore, onClose }: { totalScore: number; onClose: () => void }) {
    const [redeemed, setRedeemed] = useState<string | null>(null);
    const handleRedeem = (id: string) => { setRedeemed(id); setTimeout(() => setRedeemed(null), 2000); };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-black/10 dark:border-white/10 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/5">
                    <div className="flex items-center gap-2.5">
                        <ShoppingBag className="w-5 h-5 text-violet-400" />
                        <div>
                            <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Reward Store</h3>
                            <p className="text-[11px] text-zinc-500">Your balance: <span className="font-bold text-violet-600 dark:text-violet-400">{totalScore} pts</span></p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white"><X className="w-4 h-4" /></button>
                </div>
                <div className="divide-y divide-black/5 dark:divide-white/5 max-h-[70vh] overflow-y-auto">
                    {REWARD_ITEMS.map((item) => {
                        const canAfford = totalScore >= item.cost;
                        const isRedeemed = redeemed === item.id;
                        return (
                            <div key={item.id} className={cn('flex items-center gap-4 px-5 py-4', !canAfford && 'opacity-60')}>
                                {/* Emoji thumbnail */}
                                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-2xl shrink-0">
                                    {item.emoji}
                                </div>
                                {/* Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">{item.category}</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">{item.description}</p>
                                </div>
                                {/* Cost + Redeem */}
                                <div className="shrink-0 text-right space-y-1.5">
                                    <p className="text-sm font-bold text-violet-600 dark:text-violet-400">{item.cost} pts</p>
                                    <button onClick={() => handleRedeem(item.id)} disabled={!canAfford}
                                        className={cn('px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors whitespace-nowrap',
                                            isRedeemed ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                                                : canAfford ? 'bg-violet-600 hover:bg-violet-500 text-white'
                                                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed')}>
                                        {isRedeemed ? '\u2713 Coming soon!' : canAfford ? 'Redeem' : 'Not enough'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="px-5 py-3 bg-zinc-50 dark:bg-zinc-800/50 text-center">
                    <p className="text-[11px] text-zinc-400">\ud83d\ude80 Full reward redemption coming in a future update!</p>
                </div>
            </div>
        </div>
    );
}

// ── Goal Card ─────────────────────────────────────────────────

function GoalCard({ goal, onDelete }: { goal: Goal; onDelete: (id: string) => void }) {
    const pct = calcProgress(goal.current, goal.target);
    const endDate = new Date(goal.endDate);
    const endStr = isNaN(endDate.getTime()) ? '' : endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const dr = goal.daysRemaining;

    const statusInfo = {
        achieved: { label: '\u2713 Achieved', cls: 'bg-emerald-500/20 text-emerald-500' },
        missed:   { label: '\u2715 Missed',   cls: 'bg-red-500/20 text-red-400' },
        active:   { label: 'Active',           cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' },
    }[goal.status ?? 'active'] ?? { label: 'Active', cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500' };

    const borderCls = goal.status === 'achieved' ? 'border-emerald-500/20 bg-emerald-500/5'
        : goal.status === 'missed' ? 'border-red-500/20 bg-red-500/5'
        : 'border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900/80';

    return (
        <div className={cn('rounded-2xl border p-4 transition-all', borderCls)}>
            <div className="flex items-start justify-between mb-3 gap-2">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{goal.label}</p>
                    <p className="text-[11px] text-zinc-400 capitalize mt-0.5">{goal.period} &middot; {goal.metric}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', statusInfo.cls)}>{statusInfo.label}</span>
                    <button onClick={() => onDelete(goal.id)} title="Delete goal"
                        className="text-zinc-400 hover:text-red-400 transition-colors p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Progress bar (only when active) */}
            {goal.status !== 'missed' && (
                <ProgressBar value={goal.current} max={goal.target} lowerIsBetter showValue size="md" />
            )}
            {goal.status === 'missed' && (
                <div className="flex items-center gap-1.5 text-[11px] text-red-400 mt-1">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Threshold exceeded — {goal.current} {goal.unit} vs {goal.target} {goal.unit} target</span>
                </div>
            )}

            {/* Dates */}
            <div className="flex items-center justify-between mt-3 text-[11px] text-zinc-400">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Ends {endStr}</span>
                {goal.status === 'active' && (
                    <span className={cn('font-semibold', dr <= 0 ? 'text-orange-400' : dr <= 2 ? 'text-amber-400' : 'text-zinc-500')}>
                        {dr <= 0 ? 'Evaluating\u2026' : `${dr} day${dr !== 1 ? 's' : ''} left`}
                    </span>
                )}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────

export default function GoalsPage() {
    const {
        goals, achievements, totalScore, energyScores, communityStats,
        newScores, newAchievements,
        setGoals, addGoal, removeGoal, setAchievements,
        setTotalScore, setEnergyScores, setCommunityStats,
        setNewScores, setNewAchievements, dismissCelebration,
    } = useGoalsStore();

    const { selectedHomeId } = useSettingsStore();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRewardStore, setShowRewardStore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    // Guard: only show celebration once per data load
    const celebrationShownRef = useRef(false);

    const loadData = useCallback(async () => {
        if (!selectedHomeId) return;
        setLoading(true);
        celebrationShownRef.current = false;
        try {
            // Sequential: goals first (awards goal scores), then achievements (awards achievement scores)
            // This guarantees achData.totalScore reflects ALL points (goals + achievements)
            const goalsData = await getGoals(selectedHomeId);
            const achData = await getAchievements(selectedHomeId);

            setGoals(goalsData.goals);
            // Use achievements totalScore — it's fetched after goals finished awarding
            setTotalScore(achData.totalScore ?? goalsData.totalScore);
            setEnergyScores(goalsData.energyScores);
            setNewScores(goalsData.newScores);
            setAchievements(achData.achievements);
            setCommunityStats(achData.communityStats);
            setNewAchievements(achData.newAchievements);

            const hasCelebration = (goalsData.newScores?.length ?? 0) > 0 || (achData.newAchievements?.length ?? 0) > 0;
            if (hasCelebration && !celebrationShownRef.current) {
                celebrationShownRef.current = true;
                setShowCelebration(true);
            }
        } catch (err) {
            console.error('Failed to load goals/achievements:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedHomeId, setGoals, setTotalScore, setEnergyScores, setNewScores, setAchievements, setCommunityStats, setNewAchievements]);

    useEffect(() => { loadData(); }, [loadData]);

    const handleAddGoal = (goal: Goal) => { addGoal(goal); };
    const handleDeleteGoal = (id: string) => {
        removeGoal(id);
        deleteGoal(id).catch(console.error);
    };
    const handleDismissCelebration = () => {
        dismissCelebration();
        setShowCelebration(false);
        celebrationShownRef.current = false;
    };

    if (!selectedHomeId) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-sm text-zinc-500">Please select a home from Settings to view goals.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Target className="w-5 h-5 text-violet-400" />
                        Goals &amp; Gamification
                    </h2>
                    <p className="text-xs text-zinc-500">Track your energy goals and earn achievements</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setShowRewardStore(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-violet-500/30 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:bg-violet-500/10 transition-all">
                        <ShoppingBag className="w-3.5 h-3.5" /> Reward Store
                    </button>
                    <button onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs text-white font-semibold transition-all shadow-lg shadow-violet-500/20">
                        <Plus className="w-3.5 h-3.5" /> New Goal
                    </button>
                </div>
            </div>

            {loading && <div className="text-center py-2 text-xs text-zinc-500">Processing your goals\u2026</div>}

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {/* Left: Goals + Achievements */}
                <div className="xl:col-span-2 space-y-4">
                    {/* Goals */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">Your Goals</h3>
                        {goals.length === 0 ? (
                            <div className="rounded-2xl border border-black/5 dark:border-white/5 bg-zinc-900/80 p-8 text-center">
                                <Target className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                                <p className="text-sm text-zinc-500">No goals yet.</p>
                                <p className="text-xs text-zinc-600 mt-1">Add a goal and track your energy over a custom window.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {goals.map((goal) => (
                                    <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Achievements */}
                    <div>
                        <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2 pt-1">Achievements</h3>
                        {achievements.length === 0 ? (
                            <p className="text-xs text-zinc-500 text-center py-4">Loading achievements\u2026</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {achievements.map((ach) => {
                                    const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[ach.icon] || Trophy;
                                    return (
                                        <div key={ach.id} className={cn('rounded-2xl border p-4 text-center transition-all',
                                            ach.unlocked ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-orange-500/5'
                                                : 'bg-gray-50 border-gray-200 dark:border-white/5 dark:bg-zinc-900/50 opacity-55')}>
                                            <div className={cn('w-10 h-10 rounded-2xl mx-auto mb-2 flex items-center justify-center',
                                                ach.unlocked ? 'bg-amber-500/20' : 'bg-zinc-100 dark:bg-zinc-800')}>
                                                {ach.unlocked
                                                    ? <Icon className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                                                    : <Lock className="w-4 h-4 text-zinc-400 dark:text-zinc-600" />}
                                            </div>
                                            <p className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">{ach.name}</p>
                                            <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug">{ach.description}</p>
                                            <div className={cn('mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full inline-block',
                                                ach.unlocked ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400')}>
                                                +{ach.xp} pts
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right sidebar */}
                <div className="space-y-4">
                    <ChartCard title="Your Score">
                        <EfficiencyGauge score={totalScore} />
                    </ChartCard>

                    <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-indigo-900/10 p-5">
                        <div className="flex items-center gap-2 mb-1">
                            <Zap className="w-4 h-4 text-violet-400" />
                            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Total Points</p>
                        </div>
                        <p className="text-4xl font-black text-violet-600 dark:text-violet-300">{totalScore}</p>
                        <div className="mt-3 text-[11px] text-zinc-500 space-y-1">
                            <p>\ud83c\udfc6 {achievements.filter(a => a.unlocked).length} / {achievements.length} achievements</p>
                            <p>\ud83d\udccb {goals.length} goal{goals.length !== 1 ? 's' : ''} tracked</p>
                        </div>
                    </div>

                    <ChartCard title="Score History">
                        <ScoreHistoryBox scores={energyScores} />
                    </ChartCard>

                    {communityStats && (
                        <ChartCard title="Community Ranking">
                            <div className="pt-1">
                                <CommunityComparisonCard {...communityStats} />
                            </div>
                        </ChartCard>
                    )}

                    <button onClick={() => setShowRewardStore(true)}
                        className="w-full py-3 rounded-2xl border border-dashed border-violet-500/40 text-xs text-violet-600 dark:text-violet-400 font-semibold hover:bg-violet-500/5 transition-all flex items-center justify-center gap-2">
                        <ShoppingBag className="w-4 h-4" />
                        Open Reward Store &middot; {totalScore} pts available
                    </button>
                </div>
            </div>

            {showAddModal && (
                <AddGoalModal homeId={selectedHomeId} onClose={() => setShowAddModal(false)} onAdd={handleAddGoal} />
            )}
            {showRewardStore && (
                <RewardStoreDialog totalScore={totalScore} onClose={() => setShowRewardStore(false)} />
            )}
            {showCelebration && (newScores.length > 0 || newAchievements.length > 0) && (
                <CelebrationPopup newScores={newScores} newAchievements={newAchievements} onDismiss={handleDismissCelebration} />
            )}
        </div>
    );
}
