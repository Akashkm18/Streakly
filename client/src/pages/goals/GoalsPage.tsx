import React, { useState, useEffect } from 'react';
import { apiClient } from '@/shared/api/client';
import { useToast } from '@/shared/ui/Toast';
import {
  Target,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  X,
  Trash2,
  Edit2,
} from 'lucide-react';

interface Goal {
  id: string;
  habitId?: string;
  habit?: { id: string; title: string; icon: string; color: string; unit: string };
  title: string;
  targetAmount: number;
  currentAmount: number;
  unit: string;
  deadline: string;
  isCompleted: boolean;
  progressPct: number;
  daysLeft: number;
  currentDailyVelocity: number;
  requiredDailyVelocity: number;
  projectedFinishDate: string;
  status: 'ON_TRACK' | 'BEHIND' | 'COMPLETED';
}

interface HabitOption {
  id: string;
  title: string;
  icon: string;
  unit: string;
}

export const GoalsPage: React.FC = () => {
  const { addToast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<HabitOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Goal Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [habitId, setHabitId] = useState('');
  const [targetAmount, setTargetAmount] = useState(10);
  const [unit, setUnit] = useState('reps');
  const [deadline, setDeadline] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Progress Update Modal
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [updatedAmount, setUpdatedAmount] = useState(0);

  const fetchGoalsAndHabits = async () => {
    try {
      setIsLoading(true);
      const [goalsRes, habitsRes] = await Promise.all([
        apiClient<Goal[]>('/goals'),
        apiClient<HabitOption[]>('/habits'),
      ]);
      setGoals(goalsRes || []);
      setHabits(habitsRes || []);
      if (habitsRes && habitsRes.length > 0 && !habitId) {
        setHabitId(habitsRes[0].id);
        setUnit(habitsRes[0].unit);
      }
    } catch (err: any) {
      console.error('Failed to load goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalsAndHabits();
  }, []);

  const handleHabitChange = (id: string) => {
    setHabitId(id);
    const chosen = habits.find((h) => h.id === id);
    if (chosen) setUnit(chosen.unit);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;

    try {
      setIsSaving(true);
      await apiClient('/goals', {
        method: 'POST',
        body: JSON.stringify({
          habitId: habitId || undefined,
          title: title.trim(),
          targetAmount: Number(targetAmount),
          unit: unit.trim() || 'reps',
          deadline,
        }),
      });

      addToast({
        type: 'success',
        title: 'Goal Created!',
        message: `Goal "${title}" has been added with velocity projections.`,
      });

      setIsModalOpen(false);
      setTitle('');
      fetchGoalsAndHabits();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not create goal',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGoal) return;

    try {
      const isCompleted = updatedAmount >= editingGoal.targetAmount;
      await apiClient(`/goals/${editingGoal.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          currentAmount: Number(updatedAmount),
          isCompleted,
        }),
      });

      addToast({
        type: 'success',
        title: 'Progress Updated',
        message: `Updated to ${updatedAmount} ${editingGoal.unit}.`,
      });

      setEditingGoal(null);
      fetchGoalsAndHabits();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update progress',
      });
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await apiClient(`/goals/${id}`, { method: 'DELETE' });
      addToast({
        type: 'info',
        title: 'Goal Deleted',
        message: 'Goal removed.',
      });
      fetchGoalsAndHabits();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete goal',
      });
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Goals &amp; Velocity Projections
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              {goals.length} Goals
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Dynamic pace tracking and projected completion dates based on your daily rate.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Target Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading your goals...</div>
      ) : goals.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No active goals yet.</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Set ambitious targets like "Read 12 books by Dec 31" or "Run 200 km before summer" to see live completion forecasts.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Goal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((g) => {
            const isCompleted = g.status === 'COMPLETED' || g.isCompleted;
            const isBehind = g.status === 'BEHIND';

            return (
              <div
                key={g.id}
                className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {g.habit && (
                        <span className="text-lg shrink-0">{g.habit.icon}</span>
                      )}
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">{g.title}</h3>
                        {g.habit && (
                          <p className="text-[11px] text-slate-500">{g.habit.title}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isCompleted
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                            : isBehind
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        }`}
                      >
                        {isCompleted ? 'COMPLETED' : isBehind ? 'BEHIND' : 'ON TRACK'}
                      </span>

                      <button
                        onClick={() => handleDeleteGoal(g.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded-md"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5 mt-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Progress: <strong className="text-slate-800 dark:text-slate-200">{g.currentAmount} / {g.targetAmount} {g.unit}</strong>
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{g.progressPct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-indigo-600' : isBehind ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${g.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Velocity & Projection Stats */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <div>
                      <p className="text-slate-400">Current Velocity</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {g.currentDailyVelocity} {g.unit}/day
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Required Pace</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-300">
                        {g.requiredDailyVelocity} {g.unit}/day
                      </p>
                    </div>
                    <div className="col-span-2 mt-1">
                      <p className="text-slate-400">Projected Finish Date</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {g.projectedFinishDate} ({g.daysLeft} days remaining)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Update button */}
                <button
                  onClick={() => {
                    setEditingGoal(g);
                    setUpdatedAmount(g.currentAmount);
                  }}
                  className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3 h-3 text-slate-400" />
                  <span>Update Progress Amount</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Target Goal</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Read 12 books by Dec 31"
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Associated Hobby (Optional)
                </label>
                <select
                  value={habitId}
                  onChange={(e) => handleHabitChange(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">None (Independent Goal)</option>
                  {habits.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.icon} {h.title} ({h.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Amount
                  </label>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    min={1}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="books, km, hours"
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {isSaving ? 'Creating...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Progress Modal */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Update Goal Progress</h3>
              <button
                onClick={() => setEditingGoal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateProgress} className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">
                  Goal: <strong className="text-slate-800 dark:text-slate-200">{editingGoal.title}</strong>
                </p>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Amount Completed ({editingGoal.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  value={updatedAmount}
                  onChange={(e) => setUpdatedAmount(Number(e.target.value))}
                  min={0}
                  required
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                >
                  Save Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
