import React from 'react';
import { motion } from 'framer-motion';

export interface RingProgressProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}

export const RingProgress: React.FC<RingProgressProps> = ({
  score = 0,
  size = 54,
  strokeWidth = 5,
  showLabel = true,
}) => {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Determine color theme based on momentum tier
  const getGradientId = () => {
    if (normalizedScore >= 80) return 'momentum-high';
    if (normalizedScore >= 50) return 'momentum-med';
    return 'momentum-low';
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="momentum-high" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
          <linearGradient id="momentum-med" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
          <linearGradient id="momentum-low" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.08)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />

        {/* Progress Arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${getGradientId()})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>

      {showLabel && (
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-[11px] font-bold font-heading text-slate-100">
            {Math.round(normalizedScore)}
          </span>
        </div>
      )}
    </div>
  );
};
