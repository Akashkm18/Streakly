import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import confetti from 'canvas-confetti';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '@/entities/user/model/useAuthStore';
import { useToast } from '@/shared/ui/Toast';
import { HabitIcon } from '@/shared/ui/HabitIcon';
import { formatSchedule } from '@/shared/utils/scheduleFormatter';
import {
  Flame,
  CheckCircle2,
  Plus,
  Target,
  Snowflake,
  Award,
  Calendar,
  Star,
  Sparkles,
  Trophy,
  X,
  RotateCcw,
} from 'lucide-react';

interface Habit {
  id: string;
  title: string;
  description?: string;
  icon: string;
  color: string;
  unit: string;
  targetAmount: number;
  scheduleType: string;
  scheduleDays?: any;
  timesPerWeek?: number;
  currentStreak: number;
  longestStreak: number;
  weeklyStreak: number;
  totalCheckIns: number;
  personalBestAmount: number;
  category?: { id: string; name: string; color: string; icon: string };
  isTodayCompleted: boolean;
  isScheduledToday: boolean;
  weekTotal: number;
  monthTotal: number;
}

interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  unit: string;
  progressPct: number;
  daysLeft: number;
  status: 'ON_TRACK' | 'BEHIND' | 'COMPLETED';
  projectedFinishDate: string;
  habit?: { id: string; title: string; icon: string; color: string };
}

interface RecentBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: string;
  earnedAt: string;
}

interface FreezeData {
  usedThisMonth: number;
  maxPerMonth: number;
  remainingThisMonth: number;
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check-In Modal State
  const [activeCheckInHabit, setActiveCheckInHabit] = useState<Habit | null>(null);
  const [checkInAmount, setCheckInAmount] = useState<number>(0);
  const [checkInNote, setCheckInNote] = useState<string>('');
  const [checkInEffort, setCheckInEffort] = useState<number>(4);
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  // Personal Record Modal
  const [recordCelebration, setRecordCelebration] = useState<{
    habitTitle: string;
    newBest: number;
    unit: string;
  } | null>(null);

  // 1. Fetch Habits with TanStack Query
  const {
    data: habits = [],
    isLoading: isLoadingHabits,
    refetch: refetchHabits,
  } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: () => apiClient<Habit[]>('/habits'),
  });

  // 2. Fetch Goals
  const { data: goals = [] } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: () => apiClient<Goal[]>('/goals'),
  });

  // 3. Fetch Recent Badges
  const { data: recentBadges = [] } = useQuery<RecentBadge[]>({
    queryKey: ['badges-recent'],
    queryFn: () => apiClient<RecentBadge[]>('/badges/recent'),
  });

  // 4. Fetch Freezes
  const { data: freezes = null } = useQuery<FreezeData | null>({
    queryKey: ['freezes'],
    queryFn: () => apiClient<FreezeData>('/freezes'),
  });

  const openCheckInModal = (habit: Habit) => {
    setActiveCheckInHabit(habit);
    setCheckInAmount(habit.targetAmount);
    setCheckInNote('');
    setCheckInEffort(4);
  };

  const handlePerformCheckIn = async () => {
    if (!activeCheckInHabit) return;
    try {
      setIsSubmittingCheckIn(true);
      const today = new Date().toISOString().split('T')[0];

      const res = await apiClient<any>(`/habits/${activeCheckInHabit.id}/checkin`, {
        method: 'POST',
        body: JSON.stringify({
          amount: checkInAmount,
          note: checkInNote.trim() || undefined,
          effort: checkInEffort,
          date: today,
        }),
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#4F46E5', '#6366F1', '#10B981', '#F59E0B'],
      });

      if (res?.isNewPersonalRecord) {
        setRecordCelebration({
          habitTitle: activeCheckInHabit.title,
          newBest: res.habit.personalBestAmount,
          unit: activeCheckInHabit.unit,
        });
      }

      addToast({
        type: 'success',
        title: 'Check-in Logged!',
        message: `${activeCheckInHabit.title}: ${checkInAmount} ${activeCheckInHabit.unit} completed. Streak: ${res?.habit?.currentStreak} days!`,
      });

      setActiveCheckInHabit(null);
      // Invalidate queries so Dashboard and Goals immediately refresh
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
      await queryClient.invalidateQueries({ queryKey: ['goals'] });
      await queryClient.invalidateQueries({ queryKey: ['badges-recent'] });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Check-In Error',
        message: err.message || 'Could not complete check-in.',
      });
    } finally {
      setIsSubmittingCheckIn(false);
    }
  };

  const handleUndoCheckIn = async (habitId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await apiClient(`/habits/${habitId}/checkin/${today}`, {
        method: 'DELETE',
      });
      addToast({
        type: 'info',
        title: 'Check-in Undone',
        message: "Today's check-in was removed.",
      });
      await queryClient.invalidateQueries({ queryKey: ['habits'] });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Undo Error',
        message: err.message || 'Could not undo check-in.',
      });
    }
  };

  // Fix 2: "5 of 4 completed" is wrong. Count completed vs scheduled TODAY only.
  // Completed can NEVER exceed scheduled.
  const scheduledTodayHabits = habits.filter((h) => h.isScheduledToday);
  const totalScheduledToday = scheduledTodayHabits.length || habits.length;
  const completedTodayHabits = scheduledTodayHabits.filter((h) => h.isTodayCompleted);
  const todayCompletedCount = Math.min(totalScheduledToday, completedTodayHabits.length);
  const completionPercentage = totalScheduledToday > 0 ? Math.round((todayCompletedCount / totalScheduledToday) * 100) : 0;
  const maxStreak = habits.reduce((max, h) => Math.max(max, h.currentStreak), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Today's Rhythm */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Today's Rhythm
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              {todayCompletedCount} of {totalScheduledToday} completed
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Maintain momentum across your daily crafts and hobbies.
          </p>

          {/* Progress Bar */}
          <div className="mt-3 w-full md:w-80 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Pill Grid */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Top Active Streak</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 mt-0.5">
              <Flame className="w-4 h-4 fill-amber-500" />
              <span>{maxStreak}d</span>
            </p>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Monthly Freezes</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1 mt-0.5">
              <Snowflake className="w-4 h-4" />
              <span>{freezes?.remainingThisMonth ?? 2} left</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Hobbies Checklist (Left) & Sidebar Widgets (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Hobbies Checklist */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span>Today's Hobbies</span>
              <span className="text-xs font-normal text-slate-500">({habits.length} active)</span>
            </h3>
            <Link
              to="/library"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Explore Library</span>
            </Link>
          </div>

          {isLoadingHabits ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading your habits...</div>
          ) : habits.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No hobbies tracked yet.</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Select from 40+ curated presets in the Hobby Library to start tracking your streak.
              </p>
              <Link
                to="/library"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Browse Hobby Library</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {habits.map((h) => {
                const isDone = h.isTodayCompleted;
                return (
                  <div
                    key={h.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      isDone
                        ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 opacity-90'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                    }`}
                  >
                    {/* Left: Fixed size Icon & Title with zero overlap */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Link
                        to={`/hobbies/${h.id}`}
                        className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold transition-transform hover:scale-105"
                        style={{ backgroundColor: `${h.color}15`, color: h.color }}
                        title="View details"
                      >
                        <HabitIcon name={h.icon} className="w-5 h-5" />
                      </Link>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/hobbies/${h.id}`}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate"
                          >
                            {h.title}
                          </Link>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {formatSchedule(h)}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>
                            Target: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{h.targetAmount} {h.unit}</strong>
                          </span>
                          <span>•</span>
                          <span>7d total: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{h.weekTotal} {h.unit}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Streak & Check-in Button */}
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Streak Pill */}
                      <div
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          h.currentStreak > 0
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        <Flame className={`w-3.5 h-3.5 ${h.currentStreak > 0 ? 'fill-amber-500' : ''}`} />
                        <span>{h.currentStreak}d</span>
                      </div>

                      {/* Action Button */}
                      {isDone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Done</span>
                          </span>
                          <button
                            onClick={() => handleUndoCheckIn(h.id)}
                            title="Undo today's check-in"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => openCheckInModal(h)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Check In</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Widgets */}
        <div className="space-y-6">
          {/* Active Goals Widget */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Goals &amp; Projections</span>
              </h3>
              <Link to="/goals" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                View all
              </Link>
            </div>

            {goals.length === 0 ? (
              <p className="text-xs text-slate-400">No active goals. Set your first deadline in Goals.</p>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 3).map((g) => {
                  const isBehind = g.status === 'BEHIND';
                  return (
                    <div key={g.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{g.title}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isBehind
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          }`}
                        >
                          {g.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isBehind ? 'bg-amber-500' : 'bg-indigo-600'}`}
                          style={{ width: `${g.progressPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{g.currentAmount} / {g.targetAmount} {g.unit}</span>
                        <span>{g.daysLeft}d left</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Badges Shelf Preview */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Recent Badges</span>
              </h3>
              <Link to="/badges" className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                View Shelf
              </Link>
            </div>

            {recentBadges.length === 0 ? (
              <p className="text-xs text-slate-400">Complete your first check-in to unlock badges.</p>
            ) : (
              <div className="space-y-2">
                {recentBadges.slice(0, 2).map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm shrink-0">
                      🏆
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{b.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Check-In Modal with Measurable Amount, Notes, and Effort Rating */}
      <AnimatePresence>
        {activeCheckInHabit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 shrink-0 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                    <HabitIcon name={activeCheckInHabit.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Log Session: {activeCheckInHabit.title}
                    </h3>
                    <p className="text-xs text-slate-500">Record measurable progress &amp; effort</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveCheckInHabit(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Amount Completed ({activeCheckInHabit.unit})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={checkInAmount}
                    onChange={(e) => setCheckInAmount(Number(e.target.value))}
                    min={0.1}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-semibold text-slate-400">
                    {activeCheckInHabit.unit}
                  </span>
                </div>
                {activeCheckInHabit.personalBestAmount > 0 && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Personal Best: <strong className="text-slate-700 dark:text-slate-300">{activeCheckInHabit.personalBestAmount} {activeCheckInHabit.unit}</strong>
                  </p>
                )}
              </div>

              {/* Effort Rating 1-5 */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Effort / Energy Level (1 to 5)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setCheckInEffort(level)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                        checkInEffort === level
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Star className={`w-3 h-3 ${checkInEffort >= level ? 'fill-current' : ''}`} />
                      <span>{level}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Session Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Session Note (Optional)
                </label>
                <textarea
                  rows={2}
                  value={checkInNote}
                  onChange={(e) => setCheckInNote(e.target.value)}
                  placeholder="What did you focus on today? Any breakthroughs or learnings?"
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCheckInHabit(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handlePerformCheckIn}
                  disabled={isSubmittingCheckIn || checkInAmount <= 0}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmittingCheckIn ? 'Saving...' : 'Complete Check-In'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Personal Record Celebration Modal */}
      <AnimatePresence>
        {recordCelebration && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 p-6 shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Trophy className="w-7 h-7" />
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  New Personal Record!
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  {recordCelebration.habitTitle}
                </h3>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">
                  {recordCelebration.newBest} {recordCelebration.unit}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  You just shattered your previous single-session best! Record Breaker badge unlocked.
                </p>
              </div>

              <button
                onClick={() => setRecordCelebration(null)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md"
              >
                Keep Crushing It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
