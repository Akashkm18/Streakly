import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/shared/api/client';
import { useToast } from '@/shared/ui/Toast';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Flame,
  CheckCircle2,
  Calendar,
  Trophy,
  Star,
  RotateCcw,
  Trash2,
  Clock,
  TrendingUp,
  Tag,
} from 'lucide-react';
import { HabitIcon } from '@/shared/ui/HabitIcon';

export const HobbyDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [habit, setHabit] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check-In State
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [effort, setEffort] = useState<number>(4);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHabit = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const data = await apiClient<any>(`/habits/${id}`);
      setHabit(data);
      setAmount(data?.targetAmount || 1);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to load habit',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabit();
  }, [id]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setIsSubmitting(true);
      const today = new Date().toISOString().split('T')[0];

      const res = await apiClient<any>(`/habits/${id}/checkin`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(amount) || habit.targetAmount,
          note: note.trim() || undefined,
          effort,
          date: today,
        }),
      });

      confetti({
        particleCount: 40,
        spread: 60,
        colors: ['#4F46E5', '#6366F1', '#10B981'],
      });

      addToast({
        type: 'success',
        title: 'Session Logged',
        message: `${amount} ${habit.unit} recorded.`,
      });

      setNote('');
      fetchHabit();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Check-In Failed',
        message: err.message || 'Could not log session',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this hobby?')) return;
    try {
      await apiClient(`/habits/${id}`, { method: 'DELETE' });
      addToast({
        type: 'info',
        title: 'Hobby Archived',
        message: 'Hobby moved to archive.',
      });
      navigate('/dashboard');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.message || 'Could not archive hobby',
      });
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading hobby details...</div>;
  }

  if (!habit) {
    return (
      <div className="p-12 text-center">
        <p className="text-sm font-semibold">Hobby not found.</p>
        <Link to="/dashboard" className="text-xs text-indigo-600 hover:underline mt-2 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const checkIns = habit.checkIns || [];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>

        <button
          onClick={handleArchive}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Archive Hobby</span>
        </button>
      </div>

      {/* Main Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs shrink-0"
            style={{ backgroundColor: `${habit.color}15`, color: habit.color }}
          >
            <HabitIcon name={habit.icon} className="w-7 h-7" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {habit.title}
              </h1>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {habit.category?.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Target: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{habit.targetAmount} {habit.unit}</strong> • Schedule: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{habit.scheduleType}</strong>
            </p>
          </div>
        </div>

        {/* Current streak pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/50 text-center">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Current Streak</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 mt-0.5">
              <Flame className="w-5 h-5 fill-amber-500" />
              <span>{habit.currentStreak} days</span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Longest Streak</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{habit.longestStreak} days</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Personal Record</p>
          <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>{habit.personalBestAmount} {habit.unit}</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">7-Day Total</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{habit.weekTotal} {habit.unit}</p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Check-Ins</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{habit.totalCheckIns} sessions</p>
        </div>
      </div>

      {/* Quick Check-In Form */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          <span>Log New Session</span>
        </h3>

        <form onSubmit={handleCheckIn} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount ({habit.unit})
              </label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={0.1}
                required
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Effort Rating (1-5)
              </label>
              <div className="flex items-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setEffort(lvl)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      effort === lvl
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {lvl} ★
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Session Note &amp; Reflection
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What techniques, drills, or thoughts came up in this session?"
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || amount <= 0}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Logging...' : 'Record Session'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Session Notes History */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Session History &amp; Notes ({checkIns.length} entries)</span>
        </h3>

        {checkIns.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            No sessions recorded yet. Complete your first check-in above!
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {checkIns.map((c: any) => (
              <div key={c.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {new Intl.DateTimeFormat('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(new Date(c.date))}
                    </span>
                    <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                      {c.amount} {habit.unit}
                    </span>
                    {c.effort && (
                      <span className="flex items-center gap-0.5 text-amber-500 text-[11px] font-semibold">
                        <Star className="w-3 h-3 fill-amber-500" />
                        <span>{c.effort}/5</span>
                      </span>
                    )}
                  </div>
                  {c.note ? (
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800">
                      "{c.note}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">No notes logged.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
