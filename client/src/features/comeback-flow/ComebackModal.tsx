import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/ui/Toast';
import { apiClient } from '@/shared/api/client';
import { Habit, ComebackPlan } from '@/entities/habit/model/types';
import { Flame, CheckCircle, Sparkles, Award } from 'lucide-react';

export interface ComebackModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
  plan: ComebackPlan | null;
  onRefresh: () => void;
}

export const ComebackModal: React.FC<ComebackModalProps> = ({
  isOpen,
  onClose,
  habit,
  plan,
  onRefresh,
}) => {
  const { success, error } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const currentDay = plan?.currentDay || 0;
  const targetDays = plan?.targetDays || 3;
  const brokenStreak = plan?.brokenStreak || 7;
  const restoredStreak = plan?.restoredStreak || 5;

  const handleStartOrProgress = async () => {
    setIsLoading(true);
    try {
      if (!plan) {
        await apiClient(`/comeback/${habit.id}/start`, { method: 'POST' });
        success('Comeback Plan Activated!', 'Complete 3 daily micro-actions to unlock your Phoenix Streak.');
      } else {
        const res = await apiClient(`/comeback/${habit.id}/progress`, { method: 'POST' });
        if (res?.status === 'COMPLETED') {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#ef4444', '#f97316', '#fbbf24', '#f59e0b'],
          });
          success('🔥 PHOENIX REBIRTH!', `Congratulations! ${restoredStreak} days restored to your streak.`);
        } else {
          success(`Day ${currentDay + 1} Cleared!`, 'Keep going! 1 step closer to streak restoration.');
        }
      }
      onRefresh();
      onClose();
    } catch (err: any) {
      error('Failed to update Comeback Plan', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { day: 1, title: 'Day 1: Reignite the Spark', desc: 'Complete 1 easy rep. No pressure, just show up.' },
    { day: 2, title: 'Day 2: Fan the Embers', desc: 'Reinforce the rhythm. Consistency beats intensity.' },
    { day: 3, title: 'Day 3: Phoenix Rebirth', desc: `Lock it in to restore ${restoredStreak} days of your old streak!` },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Phoenix Comeback Mode"
      description="Life happened, but your momentum doesn't vanish. Recover your streak in 3 days."
      maxWidth="max-w-md"
    >
      <div className="space-y-5 pt-2">
        {/* Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-red-500/20 via-orange-500/20 to-amber-500/20 border border-orange-500/40 text-center">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="w-12 h-12 mx-auto rounded-full bg-gradient-to-tr from-red-500 to-amber-400 flex items-center justify-center text-white shadow-flame mb-2"
          >
            <Flame className="w-6 h-6 fill-current" />
          </motion.div>
          <h4 className="text-sm font-bold font-heading text-white">
            Lost {brokenStreak} Days? Restore {restoredStreak} Days
          </h4>
          <p className="text-xs text-slate-300 mt-1">
            Complete a gentle 3-day recovery ramp to rise from the ashes.
          </p>
        </div>

        {/* 3 Steps Stepper */}
        <div className="space-y-2.5">
          {steps.map((s) => {
            const isCompleted = currentDay >= s.day;
            const isCurrent = currentDay + 1 === s.day;

            return (
              <div
                key={s.day}
                className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-200'
                    : isCurrent
                    ? 'bg-slate-850 border-orange-500/50 shadow-flame text-white'
                    : 'bg-slate-900/40 border-slate-800 opacity-50 text-slate-400'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                        isCurrent ? 'border-orange-400 text-orange-400' : 'border-slate-600 text-slate-600'
                      }`}
                    >
                      {s.day}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-semibold">{s.title}</h5>
                    {isCurrent && (
                      <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                        Next Step
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            type="button"
            variant="primary"
            onClick={handleStartOrProgress}
            isLoading={isLoading}
            className="w-full gap-2 py-3 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 font-bold"
          >
            <Sparkles className="w-4 h-4 text-white" />
            {!plan
              ? 'Begin 3-Day Comeback Ramp'
              : currentDay >= 2
              ? `Claim Phoenix Rebirth (+${restoredStreak} Streak)`
              : `Complete Step ${currentDay + 1}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
