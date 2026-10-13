import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, TrendingDown, Check, X } from 'lucide-react';
import { apiClient } from '@/shared/api/client';
import { useToast } from '@/shared/ui/Toast';

export interface GoalSuggestionItem {
  id: string;
  habitId: string;
  suggestedTarget: number;
  direction: 'INCREASE' | 'DECREASE';
  reason: string;
  habit: {
    id: string;
    title: string;
    targetValue: number;
    targetUnit: string;
    plantType: string;
  };
}

export interface AdaptiveGoalBannerProps {
  suggestions: GoalSuggestionItem[];
  onRefresh: () => void;
}

export const AdaptiveGoalBanner: React.FC<AdaptiveGoalBannerProps> = ({ suggestions, onRefresh }) => {
  const { addToast } = useToast();

  if (!suggestions || suggestions.length === 0) return null;

  const handleRespond = async (suggestionId: string, action: 'ACCEPT' | 'DISMISS') => {
    try {
      await apiClient(`/adaptive/suggestions/${suggestionId}/respond`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });

      addToast({
        type: 'success',
        title: action === 'ACCEPT' ? '🎯 Target Adjusted!' : 'Suggestion Dismissed',
        message: action === 'ACCEPT' ? 'Your habit target has been updated.' : 'We will keep current target steady.',
      });

      onRefresh();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not update suggestion',
      });
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {suggestions.map((s) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900/60 border border-emerald-500/30 backdrop-blur-md shadow-garden"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                {s.direction === 'INCREASE' ? (
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Adaptive Calibration
                  </span>
                  <span className="text-xs text-emerald-300 font-semibold">• {s.habit.title}</span>
                </div>
                <p className="text-sm text-emerald-100 mt-0.5">{s.reason}</p>
                <div className="text-xs text-emerald-300/80 mt-1">
                  Proposed Target: <span className="font-bold text-white">{s.habit.targetValue}</span> →{' '}
                  <span className="font-bold text-emerald-300">{s.suggestedTarget} {s.habit.targetUnit}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => handleRespond(s.id, 'DISMISS')}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-emerald-300/70 hover:text-white hover:bg-emerald-950/60 border border-transparent hover:border-emerald-800 transition-colors cursor-pointer"
              >
                Keep Current
              </button>
              <button
                onClick={() => handleRespond(s.id, 'ACCEPT')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Accept Target
              </button>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
