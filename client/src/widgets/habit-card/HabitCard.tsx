import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Habit } from '@/entities/habit/model/types';
import { RingProgress } from '@/shared/ui/RingProgress';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { habitsApi } from '@/entities/habit/api/habitsApi';
import { useToast } from '@/shared/ui/Toast';
import {
  Flame,
  Check,
  RotateCcw,
  MoreVertical,
  Pause,
  BookOpen,
  Share2,
  Trash2,
  Edit,
  Sparkles,
  Shield,
  AlertTriangle,
} from 'lucide-react';

export interface HabitCardProps {
  habit: Habit;
  onRefresh: () => void;
  onOpenJournal: (habit: Habit) => void;
  onOpenPause: (habit: Habit) => void;
  onOpenComeback: (habit: Habit) => void;
  onOpenShare: (habit: Habit) => void;
  onEdit: (habit: Habit) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onRefresh,
  onOpenJournal,
  onOpenPause,
  onOpenComeback,
  onOpenShare,
  onEdit,
}) => {
  const { success, error } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const { stats } = habit;
  const isCompletedToday = stats.isCompletedToday;
  const isPaused = stats.status === 'paused';
  const isAtRisk = stats.isAtRiskToday;
  const isBroken = stats.status === 'broken';

  const handleQuickCheckIn = async () => {
    setIsUpdating(true);
    try {
      if (isCompletedToday) {
        // Undo check-in
        const todayStr = new Date().toISOString().split('T')[0];
        await habitsApi.undoCheckIn(habit.id, todayStr);
        success('Check-in Undone', `Removed check-in for ${habit.name}.`);
      } else {
        // Quick check-in
        const res = await habitsApi.checkIn({ habitId: habit.id });
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.7 },
          colors: ['#f97316', '#f59e0b', '#fbbf24'],
        });
        success('Streak Maintained!', `Checked in for ${habit.name}.`);

        if (res?.earnedToken) {
          success('🛡️ Freeze Token Earned!', 'Added 1 Freeze Token to your wallet.');
        }
      }
      onRefresh();
    } catch (err: any) {
      error('Action Failed', err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to extinguish and delete "${habit.name}"?`)) {
      try {
        await habitsApi.delete(habit.id);
        success('Habit Deleted', `${habit.name} was removed.`);
        onRefresh();
      } catch (err: any) {
        error('Delete Failed', err.message);
      }
    }
  };

  return (
    <div className="relative rounded-2xl glass-card p-5 border border-slate-800 hover:border-slate-700 transition-all duration-200 group flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          {/* Icon & Title */}
          <Link to={`/habit/${habit.id}`} className="flex items-center gap-3 group/title flex-1 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover/title:scale-105"
              style={{ backgroundColor: `${habit.color}25`, color: habit.color }}
            >
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-bold font-heading text-white truncate group-hover/title:text-ember-400 transition-colors">
                {habit.name}
              </h3>
              {habit.description && (
                <p className="text-xs text-slate-400 truncate mt-0.5">{habit.description}</p>
              )}
            </div>
          </Link>

          {/* Action Menu Toggle */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 mt-1 w-48 rounded-xl bg-slate-900 border border-slate-750 shadow-xl py-1 z-30 text-xs">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenJournal(habit);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-ember-400" />
                    Micro-Journal Note
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenPause(habit);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5 text-sky-400" />
                    {isPaused ? 'Manage Pause' : 'Smart Pause'}
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenComeback(habit);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                    Comeback Recovery
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenShare(habit);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-amber-400" />
                    Generate Share Card
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(habit);
                    }}
                    className="w-full px-3.5 py-2 text-left text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-400" />
                    Edit Habit
                  </button>
                  <div className="border-t border-slate-800 my-1" />
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleDelete();
                    }}
                    className="w-full px-3.5 py-2 text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    Delete Habit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          {isPaused && (
            <Badge variant="paused">
              <Shield className="w-3 h-3" /> Paused (Frozen)
            </Badge>
          )}
          {isAtRisk && (
            <Badge variant="warning">
              <AlertTriangle className="w-3 h-3" /> Streak at Risk
            </Badge>
          )}
          {habit.activeComebackPlan && (
            <Badge variant="flame">
              Phoenix Step {habit.activeComebackPlan.currentDay}/3
            </Badge>
          )}
          <span className="text-[11px] text-slate-500">
            {habit.frequency === 'DAILY' ? 'Daily' : habit.frequency === 'WEEKDAYS' ? 'Weekdays' : 'Custom'}
          </span>
        </div>
      </div>

      {/* Middle Stats Bar: Raw Streak + Momentum Score Ring */}
      <div className="my-5 p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between">
        {/* Streak Counter */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Streak
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Flame className={`w-5 h-5 ${stats.currentStreak > 0 ? 'text-ember-500 fill-current' : 'text-slate-600'}`} />
            <span className="text-2xl font-black font-heading text-white">
              {stats.currentStreak}
            </span>
            <span className="text-xs text-slate-400">days</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            Best: {stats.longestStreak}d
          </span>
        </div>

        {/* Momentum Score Ring */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Momentum
            </span>
            <span className="text-xs font-bold text-sky-400">
              {stats.momentumScore}%
            </span>
          </div>
          <RingProgress score={stats.momentumScore} size={48} strokeWidth={4} />
        </div>
      </div>

      {/* Bottom Action: One-Click Check-in */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isCompletedToday ? 'secondary' : 'primary'}
          onClick={handleQuickCheckIn}
          isLoading={isUpdating}
          className={`flex-1 gap-2 font-semibold ${
            isCompletedToday ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' : ''
          }`}
        >
          {isCompletedToday ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              Completed Today
            </>
          ) : (
            <>
              <Flame className="w-4 h-4 fill-current text-white" />
              Check In
            </>
          )}
        </Button>

        {isCompletedToday && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleQuickCheckIn}
            title="Undo today's check-in"
            className="text-slate-400 hover:text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
