import React, { forwardRef } from 'react';
import { cn } from '../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'glow' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ember-500/50 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

    const variants = {
      primary:
        'bg-gradient-to-r from-ember-500 to-amber-500 hover:from-ember-600 hover:to-amber-600 text-white shadow-flame hover:shadow-flame-lg font-semibold',
      glow:
        'bg-ember-500 text-white shadow-flame-lg hover:shadow-flame hover:bg-ember-600 font-semibold',
      secondary:
        'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 light:bg-slate-100 light:hover:bg-slate-200 light:text-slate-800 light:border-slate-300',
      outline:
        'bg-transparent border border-ember-500/40 hover:bg-ember-500/10 text-ember-400 hover:border-ember-500',
      danger:
        'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30',
      ghost:
        'bg-transparent hover:bg-slate-800/50 text-slate-300 hover:text-white light:hover:bg-slate-100 light:text-slate-600',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5',
      icon: 'p-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
