import React, { useState } from 'react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/ui/Toast';
import { apiClient } from '@/shared/api/client';
import { Habit } from '@/entities/habit/model/types';
import { addDays, getTodayString } from '@/shared/lib/date';
import { PauseCircle, PlayCircle, ShieldCheck } from 'lucide-react';

export interface PauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
  onSuccess: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isOpen,
  onClose,
  habit,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const todayStr = getTodayString();
  const [reason, setReason] = useState('REST');
  const [endDate, setEndDate] = useState(addDays(todayStr, 7));
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isCurrentlyPaused = habit.stats.status === 'paused';

  const handlePause = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient(`/pause/${habit.id}`, {
        method: 'POST',
        body: JSON.stringify({
          startDate: todayStr,
          endDate,
          reason,
          notes: notes.trim() || undefined,
        }),
      });

      success('Habit Paused', `Your streak is safely frozen until ${endDate}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to Pause', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setIsLoading(true);
    try {
      await apiClient(`/pause/${habit.id}/resume`, { method: 'DELETE' });
      success('Habit Resumed', 'Welcome back! Your streak is active again.');
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Failed to Resume', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCurrentlyPaused ? `Manage Pause — ${habit.name}` : `Smart Pause — ${habit.name}`}
      description="Life happens. Pause your habit without losing your hard-earned streak."
    >
      {isCurrentlyPaused ? (
        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-200 text-xs space-y-1">
            <p className="font-semibold flex items-center gap-1.5 text-white">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              This habit is currently paused.
            </p>
            <p>
              Your streak of <strong className="text-white">{habit.stats.currentStreak} days</strong> is
              protected. It will automatically resume after the scheduled end date, or you can resume early right now.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleResume}
            isLoading={isLoading}
            className="w-full gap-2 bg-gradient-to-r from-sky-500 to-indigo-600"
          >
            <PlayCircle className="w-4 h-4" />
            Resume Habit Now
          </Button>
        </div>
      ) : (
        <form onSubmit={handlePause} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Reason for Pause
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-ember-500"
            >
              <option value="ILLNESS">🤒 Illness or Recovery</option>
              <option value="TRAVEL">✈️ Vacation / Travel</option>
              <option value="EXAMS">📚 Exams / Major Deadline</option>
              <option value="REST">🧘 Scheduled Rest / Break</option>
              <option value="OTHER">⚡ Other Reason</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Auto-Resume End Date
            </label>
            <input
              type="date"
              min={addDays(todayStr, 1)}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-ember-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              A scheduled background cron job will automatically resume the habit on this day.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Taking 1 week off for exam finals"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-ember-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading} className="gap-2">
              <PauseCircle className="w-4 h-4" />
              Pause Habit
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
