import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Target,
  Award,
  BarChart3,
  Settings,
  Flame,
  Snowflake,
  LogOut,
  Sun,
  Moon,
  CheckCircle2,
} from 'lucide-react';
import { useAuthStore } from '@/entities/user/model/useAuthStore';

interface SidebarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ theme, onToggleTheme, onCloseMobile }) => {
  const { user, logout } = useAuthStore();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/library', label: 'Hobby Library', icon: Compass },
    { to: '/goals', label: 'Goals & Targets', icon: Target },
    { to: '/badges', label: 'Badges Shelf', icon: Award },
    { to: '/insights', label: 'Insights', icon: BarChart3 },
    { to: '/settings', label: 'Settings & Export', icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 select-none z-30">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60">
        <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-lg">Streakly</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">PRO</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Hobby & Habit Tracker</p>
          </div>
        </NavLink>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Quick Tips or Streak freeze pill */}
        <div className="pt-6 px-1">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Snowflake className="w-3.5 h-3.5 text-blue-500" />
                Streak Freeze
              </span>
              <span className="text-blue-600 dark:text-blue-400 font-bold">2 / month</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Never lose your rhythm. Freezes auto-protect missed days.
            </p>
          </div>
        </div>
      </nav>

      {/* User Profile & Theme Toggle Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center justify-between p-2 rounded-lg">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AL'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {user?.name || 'Alex Chen'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'alex@streakly.dev'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
              className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-md text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
