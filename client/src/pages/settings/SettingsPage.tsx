import React, { useState, useEffect } from 'react';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '@/entities/user/model/useAuthStore';
import { useToast } from '@/shared/ui/Toast';
import {
  Settings,
  Snowflake,
  Calendar,
  Download,
  Printer,
  Bell,
  Sun,
  Moon,
  Trash2,
  Plus,
  CheckCircle2,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface FreezeItem {
  id: string;
  date: string;
  reason?: string;
  createdAt: string;
}

interface RestDayItem {
  id: string;
  date: string;
  reason: string;
}

interface ReminderItem {
  id: string;
  habitId: string;
  reminderTime: string;
  isEnabled: boolean;
  habit: { id: string; title: string; icon: string };
}

interface MonthlyReportData {
  user: { name: string; email: string };
  month: string;
  monthKey: string;
  totalCheckInsThisMonth: number;
  habits: {
    id: string;
    title: string;
    category: string;
    currentStreak: number;
    longestStreak: number;
    monthCheckIns: number;
    monthAmount: number;
    unit: string;
    personalBestAmount: number;
  }[];
  badgesEarned: {
    name: string;
    description: string;
    tier: string;
    earnedAt: string;
  }[];
  generatedAt: string;
}

export interface SettingsPageProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ theme, onToggleTheme }) => {
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const [freezes, setFreezes] = useState<FreezeItem[]>([]);
  const [usedThisMonth, setUsedThisMonth] = useState<number>(0);
  const [remainingThisMonth, setRemainingThisMonth] = useState<number>(2);

  const [restDays, setRestDays] = useState<RestDayItem[]>([]);
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [habits, setHabits] = useState<any[]>([]);

  // Apply Freeze Form
  const [freezeDate, setFreezeDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [freezeReason, setFreezeReason] = useState<string>('Unexpected emergency');
  const [isActivatingFreeze, setIsActivatingFreeze] = useState<boolean>(false);

  // Plan Rest Day Form
  const [restDate, setRestDate] = useState<string>('');
  const [restReason, setRestReason] = useState<string>('Rest / Travel');
  const [isPlanningRest, setIsPlanningRest] = useState<boolean>(false);

  // Monthly Report Modal
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      const [freezeRes, restRes, remRes, habRes] = await Promise.all([
        apiClient<any>('/freezes'),
        apiClient<RestDayItem[]>('/rest-days'),
        apiClient<ReminderItem[]>('/reminders'),
        apiClient<any[]>('/habits'),
      ]);

      if (freezeRes) {
        setFreezes(freezeRes.freezes || []);
        setUsedThisMonth(freezeRes.usedThisMonth || 0);
        setRemainingThisMonth(freezeRes.remainingThisMonth ?? 2);
      }
      setRestDays(restRes || []);
      setReminders(remRes || []);
      setHabits(habRes || []);
    } catch (err) {
      console.error('Failed to load settings data:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUseFreeze = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsActivatingFreeze(true);
      await apiClient('/freezes/use', {
        method: 'POST',
        body: JSON.stringify({
          date: freezeDate,
          reason: freezeReason,
        }),
      });

      addToast({
        type: 'success',
        title: 'Freeze Activated!',
        message: `Streak freeze applied for ${freezeDate}. Your streak is safe.`,
      });

      fetchData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Freeze Error',
        message: err.message || 'Could not use freeze.',
      });
    } finally {
      setIsActivatingFreeze(false);
    }
  };

  const handlePlanRestDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restDate) return;
    try {
      setIsPlanningRest(true);
      await apiClient('/rest-days', {
        method: 'POST',
        body: JSON.stringify({
          date: restDate,
          reason: restReason,
        }),
      });

      addToast({
        type: 'success',
        title: 'Rest Day Scheduled!',
        message: `Rest day recorded for ${restDate}.`,
      });

      setRestDate('');
      fetchData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Scheduling Failed',
        message: err.message || 'Could not schedule rest day.',
      });
    } finally {
      setIsPlanningRest(false);
    }
  };

  const handleDeleteRestDay = async (id: string) => {
    try {
      await apiClient(`/rest-days/${id}`, { method: 'DELETE' });
      addToast({
        type: 'info',
        title: 'Rest Day Removed',
        message: 'Scheduled rest day deleted.',
      });
      fetchData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete rest day',
      });
    }
  };

  const handleDownloadCsv = () => {
    window.open('/api/v1/export/csv', '_blank');
    addToast({
      type: 'success',
      title: 'Downloading CSV',
      message: 'Your check-ins are downloading as CSV.',
    });
  };

  const handleDownloadJson = () => {
    window.open('/api/v1/export/json', '_blank');
    addToast({
      type: 'success',
      title: 'Downloading JSON',
      message: 'Your full data archive is downloading as JSON.',
    });
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletePassword) return;
    try {
      setIsDeletingAccount(true);
      setDeleteError(null);
      await apiClient('/auth/account', {
        method: 'DELETE',
        body: JSON.stringify({ password: deletePassword }),
      });
      addToast({
        type: 'success',
        title: 'Account Deleted',
        message: 'Your account and data have been permanently removed.',
      });
      useAuthStore.getState().logout();
      window.location.href = '/register';
    } catch (err: any) {
      setDeleteError(err.message || 'Incorrect password or deletion failed');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleOpenMonthlyReport = async () => {
    try {
      setIsLoadingReport(true);
      const res = await apiClient<MonthlyReportData>('/export/monthly-report');
      setReportData(res);
      setIsReportModalOpen(true);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Report Error',
        message: err.message || 'Could not generate report.',
      });
    } finally {
      setIsLoadingReport(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Settings &amp; Tools
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage streak freezes, advance rest days, reminders, and data export.
          </p>
        </div>

        <button
          onClick={onToggleTheme}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>

      {/* Streak Freezes & Rest Days Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Streak Freezes */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Snowflake className="w-4 h-4 text-blue-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Streak Freezes</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50">
              {remainingThisMonth} of 2 Remaining
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            2 monthly freezes allowed. If an unexpected emergency prevents you from completing your habits, apply a freeze to preserve your streak.
          </p>

          <form onSubmit={handleUseFreeze} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Freeze Date
              </label>
              <input
                type="date"
                value={freezeDate}
                onChange={(e) => setFreezeDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="e.g. Travel, Urgent deadlines"
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isActivatingFreeze || remainingThisMonth <= 0}
              className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
            >
              {remainingThisMonth <= 0 ? 'Monthly Limit Reached' : 'Apply Streak Freeze'}
            </button>
          </form>
        </div>

        {/* Planned Rest Days */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Planned Rest Days</h3>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Schedule off-days in advance for holidays, recovery, or planned travel. Rest days never break your streak count.
          </p>

          <form onSubmit={handlePlanRestDay} className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Scheduled Rest Date
              </label>
              <input
                type="date"
                value={restDate}
                onChange={(e) => setRestDate(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Reason
              </label>
              <input
                type="text"
                value={restReason}
                onChange={(e) => setRestReason(e.target.value)}
                placeholder="e.g. Vacation, Recovery"
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={isPlanningRest}
              className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              Plan Rest Day
            </button>
          </form>

          {/* List of planned rest days */}
          {restDays.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 max-h-36 overflow-y-auto">
              <span className="text-[10px] font-semibold uppercase text-slate-400">Scheduled:</span>
              {restDays.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
                  <span>
                    <strong>{r.date}</strong> — {r.reason}
                  </span>
                  <button
                    onClick={() => handleDeleteRestDay(r.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Export & Reports Section */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-indigo-600" />
          <span>Data Portability &amp; Reports</span>
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your habit and hobby history belongs to you. Export raw data anytime or print a monthly progress summary.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleDownloadJson}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200/60 dark:border-slate-700/60"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>Download All Data (JSON)</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200/60 dark:border-slate-700/60"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            <span>Download All Data (CSV)</span>
          </button>

          <button
            onClick={handleOpenMonthlyReport}
            disabled={isLoadingReport}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>{isLoadingReport ? 'Generating...' : 'Printable Monthly Report'}</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Account Deletion */}
      <div className="p-6 rounded-2xl bg-rose-500/5 dark:bg-rose-950/20 border border-rose-500/20 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span>Danger Zone: Delete Account</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Permanently delete your account and all associated habits, streaks, check-in history, badges, and records.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setDeletePassword('');
              setIsDeleteModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs shrink-0"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  Delete Account &amp; Data
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This action is permanent and cannot be undone. All your habits, check-ins, streaks, and badges will be purged.
                </p>
              </div>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-600 dark:text-rose-400">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter your current password"
                  className="w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount || !deletePassword}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Monthly Report Modal */}
      {isReportModalOpen && reportData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 no-print">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Monthly Performance Report
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
                <button
                  onClick={() => setIsReportModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Document Header */}
            <div>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">Streakly</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monthly Rhythm &amp; Habit Audit • {reportData.month}
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{reportData.user.name}</p>
                  <p>{reportData.user.email}</p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Check-Ins This Month</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {reportData.totalCheckInsThisMonth}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Active Hobbies</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {reportData.habits.length}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">Badges Earned</p>
                  <p className="text-xl font-bold text-amber-500 mt-0.5">
                    {reportData.badgesEarned.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Habit Performance Table */}
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3">
                Habits Breakdown
              </h2>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Hobby</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Streak</th>
                      <th className="p-3">Month Sessions</th>
                      <th className="p-3">Month Amount</th>
                      <th className="p-3">Record Best</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {reportData.habits.map((h) => (
                      <tr key={h.id}>
                        <td className="p-3 font-semibold text-slate-900 dark:text-white">{h.title}</td>
                        <td className="p-3 text-slate-500">{h.category}</td>
                        <td className="p-3 font-bold text-amber-600">{h.currentStreak}d</td>
                        <td className="p-3">{h.monthCheckIns}</td>
                        <td className="p-3 font-semibold">{h.monthAmount} {h.unit}</td>
                        <td className="p-3">{h.personalBestAmount} {h.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Report Generated: {new Date(reportData.generatedAt).toLocaleString()}</span>
              <span>Streakly Habit Tracker</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
