import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Plus, Snowflake, Calendar as CalendarIcon, Bell } from 'lucide-react';

interface TopBarProps {
  onOpenMobileMenu?: () => void;
  title?: string;
  subtitle?: string;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu, title, subtitle }) => {
  const navigate = useNavigate();

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          {title && <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>}
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Date display */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200/50 dark:border-slate-700/50">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>{todayFormatted}</span>
        </div>

        {/* Freezes pill */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200/60 dark:border-blue-800/60 hover:bg-blue-100/70 transition-colors"
          title="Click to manage streak freezes"
        >
          <Snowflake className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline">Freezes:</span>
          <span>2 left</span>
        </button>

        {/* Quick Add button */}
        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Hobby</span>
        </button>
      </div>
    </header>
  );
};
