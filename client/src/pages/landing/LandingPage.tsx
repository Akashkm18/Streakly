import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Flame,
  CheckCircle2,
  Compass,
  Calendar,
  Target,
  Snowflake,
  BarChart3,
  Award,
  ArrowRight,
  Sparkles,
  Shield,
  Layers,
  Star,
} from 'lucide-react';
import { apiClient } from '@/shared/api/client';
import { useAuthStore } from '@/entities/user/model/useAuthStore';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [demoStreak, setDemoStreak] = useState(14);
  const [demoChecked, setDemoChecked] = useState(false);
  const [demoEffort, setDemoEffort] = useState(4);
  const [isLoggingInDemo, setIsLoggingInDemo] = useState(false);

  const handleDemoCheckIn = () => {
    if (!demoChecked) {
      setDemoStreak((s) => s + 1);
      setDemoChecked(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#4F46E5', '#6366F1', '#A5B4FC', '#F59E0B'],
      });
    } else {
      setDemoStreak((s) => s - 1);
      setDemoChecked(false);
    }
  };

  const handle1ClickDemo = async () => {
    try {
      setIsLoggingInDemo(true);
      const res = await apiClient<{ user: any }>('/auth/demo', { method: 'POST' });
      setUser(res.user);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      navigate('/login');
    } finally {
      setIsLoggingInDemo(false);
    }
  };

  const features = [
    {
      icon: Compass,
      title: '40+ Curated Hobby Library',
      desc: 'Adopt curated templates across 8 categories with preset units, icons, and suggested milestones in one click.',
      badge: 'Library',
    },
    {
      icon: Calendar,
      title: 'Flexible Schedules',
      desc: 'Not every hobby is daily. Streakly understands Mon/Wed/Fri or 3x/week without penalizing your rest days.',
      badge: 'Schedules',
    },
    {
      icon: Target,
      title: 'Goals with Velocity Projections',
      desc: 'Set targets like "Read 12 books by Dec 31". Streakly projects your completion date and pace in real time.',
      badge: 'Velocity',
    },
    {
      icon: Snowflake,
      title: 'Monthly Streak Freezes',
      desc: 'Life happens. 2 monthly freezes automatically protect your hard-earned streak from accidental lapses.',
      badge: 'Protection',
    },
    {
      icon: BarChart3,
      title: '365-Day Activity Heatmap',
      desc: 'Inspect your full year with high-density GitHub-style heatmaps, category donuts, and 12-week trends.',
      badge: 'Analytics',
    },
    {
      icon: Award,
      title: 'Milestone Badges & Shelf',
      desc: 'Earn bronze, silver, gold, and platinum badges for consistency milestones, personal bests, and perfect weeks.',
      badge: 'Achievements',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 px-6 sm:px-12 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Flame className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">Streakly</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handle1ClickDemo}
            disabled={isLoggingInDemo}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors border border-indigo-200/60 dark:border-indigo-800/50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoggingInDemo ? 'Opening...' : '1-Click Demo'}</span>
          </button>
          <Link
            to="/login"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-3.5 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-xs hover:shadow-sm transition-all"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20 max-w-5xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
          <Flame className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>The Linear-inspired habit &amp; hobby streak tracker</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] max-w-3xl">
          Build hobbies into lifelong crafts. <span className="text-indigo-600 dark:text-indigo-400">Keep every streak alive.</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
          Clean, measurable tracking for workouts, reading, coding, music, and creative arts.
          Flexible schedules, session notes, monthly freezes, and goal velocity projections.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handle1ClickDemo}
            disabled={isLoggingInDemo}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoggingInDemo ? 'Opening Demo...' : 'Explore Demo Account (Alex Chen)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <Link
            to="/register"
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
          >
            Create Free Account
          </Link>
        </div>

        {/* Live Interactive Streak Card Demo */}
        <div className="mt-14 w-full max-w-md p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Interactive Preview</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">Try Clicking</span>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg">
                🏃
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Morning Trail Run</h2>
                <p className="text-xs text-slate-500">Target: 5.0 km • Mon, Wed, Fri</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-bold text-xs border border-amber-200/50 dark:border-amber-800/50">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{demoStreak} days</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Effort:</span>
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setDemoEffort(s)}
                  className={`p-0.5 ${s <= demoEffort ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
              ))}
            </div>

            <button
              onClick={handleDemoCheckIn}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                demoChecked
                  ? 'bg-emerald-500 text-white shadow-xs'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{demoChecked ? 'Completed Today!' : 'Log 5.0 km'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="px-6 py-16 bg-white dark:bg-slate-900/50 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Crafted for deliberate practice &amp; momentum
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              No superficial gamification or plant wilting. Just clean tools for serious consistency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{f.badge}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">{f.title}</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 px-6 max-w-5xl mx-auto text-center">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">40+</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Curated Hobbies</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">8</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Categories</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">365</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Days Heatmap</p>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">100%</p>
            <p className="text-xs font-semibold text-slate-500 mt-1">Live Backend API</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-6 px-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <p>Streakly — Professional Habit &amp; Hobby Streak Tracker. All rights reserved.</p>
      </footer>
    </div>
  );
};
