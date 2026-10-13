import React from 'react';
import { cn } from '../lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'flame' | 'warning' | 'paused' | 'neutral' | 'success';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className }) => {
  const variants = {
    flame: 'bg-ember-500/15 text-ember-400 border border-ember-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    paused: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
    neutral: 'bg-slate-800 text-slate-300 border border-slate-700',
    success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
};
