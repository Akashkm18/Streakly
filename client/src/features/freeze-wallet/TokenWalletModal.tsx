import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/ui/Toast';
import { tokensApi } from '@/entities/token/api/tokensApi';
import { WalletData } from '@/entities/token/model/types';
import { Habit } from '@/entities/habit/model/types';
import { Shield, Sparkles, Snowflake, Calendar, History } from 'lucide-react';
import { subtractDays, formatDateDisplay } from '@/shared/lib/date';

export interface TokenWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: WalletData | null;
  habits: Habit[];
  onRefresh: () => void;
}

export const TokenWalletModal: React.FC<TokenWalletModalProps> = ({
  isOpen,
  onClose,
  wallet,
  habits,
  onRefresh,
}) => {
  const { success, error } = useToast();
  const [selectedHabitId, setSelectedHabitId] = useState(habits[0]?.id || '');
  const [targetDate, setTargetDate] = useState(subtractDays(new Date().toISOString().split('T')[0], 1));
  const [isSpending, setIsSpending] = useState(false);

  const unspentCount = wallet?.unspentCount || 0;
  const maxCapacity = wallet?.maxCapacity || 3;

  const handleSpend = async () => {
    if (!selectedHabitId) {
      error('Selection Required', 'Please select a habit to freeze.');
      return;
    }

    setIsSpending(true);
    try {
      await tokensApi.spendToken(selectedHabitId, targetDate);
      success('Streak Protected!', `Spent 1 Freeze Token to shield ${targetDate}.`);
      onRefresh();
      onClose();
    } catch (err: any) {
      error('Cannot Spend Token', err.message);
    } finally {
      setIsSpending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Freeze Token Wallet"
      description="Earn 1 token for every 7-day milestone. Protect missed days from breaking streaks."
      maxWidth="max-w-lg"
    >
      <div className="space-y-6 pt-2">
        {/* Animated Wallet Slots */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-inner">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Available Shield Tokens
            </span>
            <span className="text-xs font-bold text-amber-400">
              {unspentCount} / {maxCapacity} Max
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((idx) => {
              const hasToken = idx < unspentCount;
              return (
                <motion.div
                  key={idx}
                  whileHover={hasToken ? { scale: 1.05 } : {}}
                  className={`relative flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                    hasToken
                      ? 'bg-gradient-to-b from-amber-500/20 to-ember-500/10 border-amber-500/50 shadow-flame-gold'
                      : 'bg-slate-900/40 border-slate-800 border-dashed opacity-40'
                  }`}
                >
                  {hasToken ? (
                    <>
                      <motion.div
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                        className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-amber-200 flex items-center justify-center shadow-lg text-slate-950 mb-2"
                      >
                        <Snowflake className="w-5 h-5 text-slate-900" />
                      </motion.div>
                      <span className="text-[11px] font-bold text-amber-300">Ready</span>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-full border-2 border-slate-700 border-dashed flex items-center justify-center text-slate-600 mb-2">
                        <Shield className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] text-slate-500">Empty Slot</span>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Spend Form */}
        {unspentCount > 0 ? (
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Protect a Missed Day
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Select Habit
                </label>
                <select
                  value={selectedHabitId}
                  onChange={(e) => setSelectedHabitId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {habits.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Missed Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={targetDate}
                    max={subtractDays(new Date().toISOString().split('T')[0], 1)}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="glow"
              onClick={handleSpend}
              isLoading={isSpending}
              className="w-full mt-2 gap-2 text-xs py-2 bg-gradient-to-r from-amber-500 to-ember-600"
            >
              <Snowflake className="w-4 h-4" />
              Spend 1 Freeze Token
            </Button>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Your wallet is empty. Reach a 7-day streak milestone to automatically earn your next Freeze Token!
            </p>
          </div>
        )}

        {/* Spent History */}
        {wallet && wallet.tokens.filter((t) => t.isSpent).length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              Spent Token History
            </h4>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {wallet.tokens
                .filter((t) => t.isSpent)
                .map((token) => (
                  <div
                    key={token.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-slate-300">
                        Shielded date {token.spentOnDate ? formatDateDisplay(token.spentOnDate) : 'Past day'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500">
                      Earned at {token.earnedAtStreak}d streak
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
