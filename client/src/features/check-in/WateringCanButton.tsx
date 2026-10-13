import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Droplets, Check } from 'lucide-react';
import { apiClient } from '@/shared/api/client';
import { useToast } from '@/shared/ui/Toast';

export interface WateringCanButtonProps {
  habitId: string;
  habitTitle: string;
  isWateredToday: boolean;
  onWaterSuccess?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const WateringCanButton: React.FC<WateringCanButtonProps> = ({
  habitId,
  habitTitle,
  isWateredToday,
  onWaterSuccess,
  size = 'md',
}) => {
  const [isWatering, setIsWatering] = useState(false);
  const { addToast } = useToast();

  const handleWater = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWateredToday || isWatering) return;

    try {
      setIsWatering(true);

      // Perform real check-in API call
      const res = await apiClient<{
        checkIn: any;
        habit: any;
        gardenPlant: any;
        goalSuggestion: any;
      }>(`/habits/${habitId}/checkin`, {
        method: 'POST',
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0],
        }),
      });

      // Floral confetti burst
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10B981', '#34D399', '#F59E0B', '#F472B6', '#6EE7B7'],
      });

      addToast({
        type: 'success',
        title: '🌱 Nourished with Care!',
        message: `${habitTitle} watered! Current streak: ${res.habit.currentStreak} days 🔥`,
      });

      if (res.goalSuggestion) {
        addToast({
          type: 'info',
          title: '🌿 Adaptive Target Proposal',
          message: res.goalSuggestion.reason,
        });
      }

      onWaterSuccess?.();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Watering Failed',
        message: err.message || 'Could not water habit right now',
      });
    } finally {
      setIsWatering(false);
    }
  };

  if (isWateredToday) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
        <Check className="w-3.5 h-3.5" />
        Watered Today
      </span>
    );
  }

  return (
    <div className="relative inline-block">
      <motion.button
        onClick={handleWater}
        disabled={isWatering}
        whileTap={{ scale: 0.94 }}
        animate={isWatering ? { rotate: [-5, -25, -20, 0] } : {}}
        transition={{ duration: 0.8 }}
        className={`relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-garden hover:shadow-garden-lg transition-all cursor-pointer ${
          isWatering ? 'opacity-80' : ''
        }`}
      >
        <Droplets className={`w-4 h-4 ${isWatering ? 'animate-bounce text-cyan-200' : 'text-cyan-300'}`} />
        <span>{isWatering ? 'Watering...' : 'Water Habit'}</span>
      </motion.button>

      {/* Falling Animated Droplets */}
      <AnimatePresence>
        {isWatering && (
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
            <motion.div
              initial={{ y: 0, opacity: 1, scale: 0.8 }}
              animate={{ y: 20, opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.6, repeat: 2 }}
              className="w-1.5 h-2 rounded-full bg-cyan-400"
            />
            <motion.div
              initial={{ y: 0, opacity: 1, scale: 0.8 }}
              animate={{ y: 22, opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.7, repeat: 2, delay: 0.1 }}
              className="w-1.5 h-2 rounded-full bg-cyan-300"
            />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
