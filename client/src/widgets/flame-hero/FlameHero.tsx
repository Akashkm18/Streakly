import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, Trophy } from 'lucide-react';

export interface FlameHeroProps {
  bestStreak: number;
  activeHabitCount: number;
  averageMomentum: number;
}

export const FlameHero: React.FC<FlameHeroProps> = ({
  bestStreak = 0,
  activeHabitCount = 0,
  averageMomentum = 0,
}) => {
  // Determine flame tier
  const getFlameTier = (streak: number) => {
    if (streak >= 365) return { name: 'Eternal Flame', level: 5, color: '#f59e0b', nextMilestone: 1000, nextLabel: 'Legendary' };
    if (streak >= 100) return { name: 'Inferno', level: 4, color: '#ff4d4d', nextMilestone: 365, nextLabel: '365 Days' };
    if (streak >= 30) return { name: 'Roaring Fire', level: 3, color: '#f97316', nextMilestone: 100, nextLabel: '100 Days' };
    if (streak >= 7) return { name: 'Blazing Ember', level: 2, color: '#fb923c', nextMilestone: 30, nextLabel: '30 Days' };
    if (streak >= 1) return { name: 'Ignited Spark', level: 1, color: '#fdba74', nextMilestone: 7, nextLabel: '7 Days' };
    return { name: 'Dormant Spark', level: 0, color: '#94a3b8', nextMilestone: 1, nextLabel: '1 Day' };
  };

  const tier = getFlameTier(bestStreak);
  const prevMilestone = tier.level === 0 ? 0 : tier.level === 1 ? 1 : tier.level === 2 ? 7 : tier.level === 3 ? 30 : 100;
  const progressToNext = Math.min(
    100,
    Math.max(0, Math.round(((bestStreak - prevMilestone) / (tier.nextMilestone - prevMilestone)) * 100))
  );

  return (
    <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800">
      {/* Background ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-25 pointer-events-none transition-colors duration-700"
        style={{ backgroundColor: tier.color }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Dynamic Flame Visual */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center text-center">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Outer Flame Glow */}
            <motion.div
              animate={{
                scale: [1, 1.08, 0.98, 1],
                opacity: [0.6, 0.9, 0.7, 0.6],
              }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full blur-xl"
              style={{ backgroundColor: tier.color }}
            />

            {/* Flame SVG Layers */}
            <motion.svg
              viewBox="0 0 100 120"
              className="w-36 h-36 relative z-10 glow-flame"
              animate={{
                y: [0, -4, 0],
                rotate: [0, 1.5, -1.5, 0],
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            >
              <defs>
                <linearGradient id="flameGradOuter" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#c2410c" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fbbf24" />
                </linearGradient>
                <linearGradient id="flameGradInner" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="70%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>

              {/* Main Outer Flame */}
              <path
                d="M50 5 C55 30 75 40 82 65 C88 85 75 105 50 115 C25 105 12 85 18 65 C25 40 45 30 50 5 Z"
                fill="url(#flameGradOuter)"
                opacity="0.95"
              />

              {/* Middle Ember Layer */}
              <motion.path
                d="M50 25 C54 45 68 55 72 75 C76 90 65 105 50 110 C35 105 24 90 28 75 C32 55 46 45 50 25 Z"
                fill="url(#flameGradInner)"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              />

              {/* White-Hot Core Spark */}
              <path
                d="M50 55 C52 68 60 75 62 88 C64 96 58 104 50 106 C42 104 36 96 38 88 C40 75 48 68 50 55 Z"
                fill="#ffffff"
                opacity="0.85"
              />
            </motion.svg>
          </div>

          <div className="mt-2">
            <span
              className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border mb-1"
              style={{
                backgroundColor: `${tier.color}15`,
                borderColor: `${tier.color}40`,
                color: tier.color,
              }}
            >
              Stage {tier.level} • {tier.name}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Your flame burns with daily commitment.
            </p>
          </div>
        </div>

        {/* Right: Metrics & Milestone Progress */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-xs font-semibold text-ember-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4" />
              Primary Streak Velocity
            </span>
            <div className="flex items-baseline gap-3">
              <h2 className="text-4xl sm:text-5xl font-black font-heading text-white tracking-tight">
                {bestStreak}
              </h2>
              <span className="text-lg sm:text-xl font-heading text-slate-400">Days Consecutive</span>
            </div>
          </div>

          {/* Milestone Progress Bar */}
          <div className="space-y-2 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                Next Milestone: <strong className="text-white">{tier.nextLabel}</strong>
              </span>
              <span className="text-amber-400 font-bold">{progressToNext}%</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToNext}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-ember-500 via-amber-400 to-amber-300"
              />
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-ember-500/10 border border-ember-500/20 flex items-center justify-center text-ember-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Avg Momentum</span>
                <p className="text-lg font-bold font-heading text-white">{averageMomentum}%</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-medium">Active Habits</span>
                <p className="text-lg font-bold font-heading text-white">{activeHabitCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
