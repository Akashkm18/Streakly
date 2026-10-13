import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useToast } from '@/shared/ui/Toast';
import { habitsApi } from '@/entities/habit/api/habitsApi';
import { Habit } from '@/entities/habit/model/types';
import { Flame, Sparkles } from 'lucide-react';

export interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: Habit;
  onSuccess: () => void;
}

const MOODS = [
  { val: 1, emoji: '😫', label: 'Exhausted' },
  { val: 2, emoji: '🙁', label: 'Low' },
  { val: 3, emoji: '😐', label: 'Neutral' },
  { val: 4, emoji: '🙂', label: 'Good' },
  { val: 5, emoji: '🤩', label: 'Unstoppable' },
];

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  habit,
  onSuccess,
}) => {
  const { success, error } = useToast();
  const [mood, setMood] = useState(4);
  const [energy, setEnergy] = useState(4);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await habitsApi.checkIn({
        habitId: habit.id,
        journal: {
          note: note.trim() || undefined,
          mood,
          energy,
        },
      });

      // Fire particle confetti burst!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f97316', '#f59e0b', '#fbbf24', '#ff4d4d'],
      });

      success('Streak Kept Burning!', `Checked in for ${habit.name}.`);

      if (res?.earnedToken) {
        success('🛡️ Freeze Token Earned!', 'You reached a 7-day milestone! 1 Freeze Token added to wallet.');
      }

      if (res?.nextStackPrompt) {
        success(
          `⚡ Habit Stack Prompt: ${res.nextStackPrompt.stackName}`,
          res.nextStackPrompt.cueText
        );
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      error('Check-in Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Check In — ${habit.name}`}
      description="Reflect for 10 seconds to lock in your daily flame."
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Mood Selector */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            How are you feeling right now?
          </label>
          <div className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-slate-800/60 border border-slate-700/60">
            {MOODS.map((m) => (
              <button
                key={m.val}
                type="button"
                onClick={() => setMood(m.val)}
                className={`flex-1 py-2 rounded-lg flex flex-col items-center gap-1 transition-all cursor-pointer ${
                  mood === m.val
                    ? 'bg-ember-500/20 border border-ember-500/60 shadow-flame scale-105'
                    : 'hover:bg-slate-700/50 opacity-60 hover:opacity-100'
                }`}
              >
                <span className="text-xl">{m.emoji}</span>
                <span className="text-[10px] text-slate-300 font-medium">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Energy Slider */}
        <div>
          <div className="flex justify-between items-center text-xs font-medium text-slate-300 mb-1.5">
            <span>Energy Level</span>
            <span className="text-ember-400 font-bold">{energy} / 5 ⚡</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={energy}
            onChange={(e) => setEnergy(parseInt(e.target.value, 10))}
            className="w-full accent-ember-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500 px-1 mt-0.5">
            <span>1 (Drained)</span>
            <span>3 (Steady)</span>
            <span>5 (Surging)</span>
          </div>
        </div>

        {/* Micro-Note */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Micro-Reflection Note (optional)
          </label>
          <input
            type="text"
            maxLength={280}
            placeholder="e.g. 15 mins breathing before morning coffee"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/70 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-ember-500 focus:ring-1 focus:ring-ember-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} className="gap-2">
            <Flame className="w-4 h-4 text-white fill-current" />
            Ignite Check-in
          </Button>
        </div>
      </form>
    </Modal>
  );
};
