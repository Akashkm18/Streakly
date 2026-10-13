import React, { useState, useEffect } from 'react';
import { apiClient } from '@/shared/api/client';
import confetti from 'canvas-confetti';
import {
  Award,
  Sparkles,
  Flame,
  CheckCircle2,
  Trophy,
  Shield,
  Layers,
  Crown,
  Lock,
  X,
  Calendar,
} from 'lucide-react';

interface BadgeItem {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  isUnlocked: boolean;
  earnedAt?: string | null;
}

export const BadgesPage: React.FC = () => {
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [unlockedCount, setUnlockedCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [inspectBadge, setInspectBadge] = useState<BadgeItem | null>(null);

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        setIsLoading(true);
        const res = await apiClient<any>('/badges');
        setBadges(res?.badges || []);
        setUnlockedCount(res?.unlockedCount || 0);
      } catch (err) {
        console.error('Failed to load badges:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBadges();
  }, []);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'PLATINUM':
        return 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950/60 border-cyan-200 dark:border-cyan-800';
      case 'GOLD':
        return 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800';
      case 'SILVER':
        return 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
      case 'BRONZE':
      default:
        return 'text-amber-700 dark:text-amber-600 bg-amber-100/60 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900';
    }
  };

  const getBadgeIcon = (key: string) => {
    switch (key) {
      case 'first-checkin':
        return <Sparkles className="w-6 h-6 text-amber-500" />;
      case 'streak-7':
        return <Flame className="w-6 h-6 text-amber-500 fill-amber-500" />;
      case 'perfect-week':
        return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
      case 'personal-record':
        return <Trophy className="w-6 h-6 text-amber-500" />;
      case 'streak-30':
        return <Shield className="w-6 h-6 text-blue-500" />;
      case '10-hobbies':
        return <Layers className="w-6 h-6 text-indigo-500" />;
      case 'streak-100':
        return <Award className="w-6 h-6 text-amber-500" />;
      case 'streak-365':
        return <Crown className="w-6 h-6 text-purple-500" />;
      default:
        return <Award className="w-6 h-6 text-indigo-500" />;
    }
  };

  const completionPct = badges.length > 0 ? Math.round((unlockedCount / badges.length) * 100) : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Milestone Badges Shelf
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50">
              {unlockedCount} of {badges.length} Unlocked
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Permanent recognition for sustained consistency, volume, and personal records.
          </p>

          <div className="mt-3 w-full md:w-80 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500 rounded-full"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-center">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Completion</p>
            <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
              {completionPct}%
            </p>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">Loading badges shelf...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {badges.map((b) => {
            const isUnlocked = b.isUnlocked;

            return (
              <div
                key={b.id}
                onClick={() => setInspectBadge(b)}
                className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                  isUnlocked
                    ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400/80 dark:hover:border-amber-500/80 shadow-xs hover:shadow-md hover:-translate-y-0.5'
                    : 'bg-slate-50/50 dark:bg-slate-900/30 border-slate-200/50 dark:border-slate-800/50 opacity-60 hover:opacity-80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${
                        isUnlocked
                          ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isUnlocked ? getBadgeIcon(b.key) : <Lock className="w-5 h-5 text-slate-400" />}
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(
                        b.tier
                      )}`}
                    >
                      {b.tier}
                    </span>
                  </div>

                  <h3
                    className={`text-sm font-bold truncate ${
                      isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {b.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {b.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  {isUnlocked ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Locked</span>
                    </span>
                  )}
                  {b.earnedAt && (
                    <span className="text-slate-400">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
                        new Date(b.earnedAt)
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Inspect Badge Modal */}
      {inspectBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl text-center space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setInspectBadge(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg ${
                inspectBadge.isUnlocked
                  ? 'bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {inspectBadge.isUnlocked ? (
                getBadgeIcon(inspectBadge.key)
              ) : (
                <Lock className="w-7 h-7 text-slate-400" />
              )}
            </div>

            <div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getTierColor(
                  inspectBadge.tier
                )}`}
              >
                {inspectBadge.tier} TIER
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                {inspectBadge.name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {inspectBadge.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {inspectBadge.isUnlocked ? (
                <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Earned on{' '}
                  {inspectBadge.earnedAt
                    ? new Intl.DateTimeFormat('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }).format(new Date(inspectBadge.earnedAt))
                    : 'Recently'}
                </div>
              ) : (
                <div className="text-slate-400">
                  Keep maintaining streaks and hitting milestones to unlock.
                </div>
              )}
            </div>

            <button
              onClick={() => setInspectBadge(null)}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
