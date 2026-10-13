import React, { useState, useEffect } from 'react';
import { apiClient } from '@/shared/api/client';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  Flame,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Star,
  Award,
  Layers,
  Filter,
} from 'lucide-react';

interface SummaryData {
  totalCheckIns: number;
  activeHabitsCount: number;
  longestStreak: number;
  mostActiveDay: string;
  topHabit: string;
  avgEffort: number;
}

interface HeatmapDay {
  date: string;
  count: number;
  totalAmount: number;
  level: number;
}

interface BreakdownItem {
  name: string;
  color: string;
  count: number;
  percentage: number;
}

interface TrendWeek {
  weekLabel: string;
  completed: number;
  startDate: string;
  endDate: string;
}

interface HabitOption {
  id: string;
  title: string;
  icon: string;
}

export const InsightsPage: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [trends, setTrends] = useState<TrendWeek[]>([]);
  const [habits, setHabits] = useState<HabitOption[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<HeatmapDay | null>(null);

  const fetchData = async (habitId?: string) => {
    try {
      setIsLoading(true);
      const query = habitId ? `?habitId=${habitId}` : '';
      const [sumRes, heatRes, breakRes, trendRes, habitsRes] = await Promise.all([
        apiClient<SummaryData>('/insights/summary'),
        apiClient<HeatmapDay[]>(`/insights/heatmap${query}`),
        apiClient<BreakdownItem[]>('/insights/breakdown'),
        apiClient<TrendWeek[]>('/insights/trends'),
        apiClient<HabitOption[]>('/habits'),
      ]);

      setSummary(sumRes);
      setHeatmap(heatRes || []);
      setBreakdown(breakRes || []);
      setTrends(trendRes || []);
      setHabits(habitsRes || []);
    } catch (err) {
      console.error('Failed to load insights data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleHabitFilterChange = (id: string) => {
    setSelectedHabitId(id);
    fetchData(id || undefined);
  };

  // Group 365 days into 52 weeks (7 days each)
  const weeks: HeatmapDay[][] = [];
  let currentWeek: HeatmapDay[] = [];
  heatmap.forEach((day, idx) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || idx === heatmap.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getHeatmapColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-indigo-200 dark:bg-indigo-900/60';
      case 2:
        return 'bg-indigo-400 dark:bg-indigo-700';
      case 3:
        return 'bg-indigo-600 dark:bg-indigo-500';
      case 4:
        return 'bg-indigo-800 dark:bg-indigo-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800/80';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              365-Day Insights &amp; Analytics
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              Live Activity
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            GitHub-style heatmaps, category volume distribution, and 12-week trends.
          </p>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedHabitId}
            onChange={(e) => handleHabitFilterChange(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Hobbies (Aggregated)</option>
            {habits.map((h) => (
              <option key={h.id} value={h.id}>
                {h.icon} {h.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Check-Ins</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {summary?.totalCheckIns || 0}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active Hobbies</p>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">
            {summary?.activeHabitsCount || 0}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Longest Streak</p>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
            <Flame className="w-4 h-4 fill-amber-500" />
            <span>{summary?.longestStreak || 0}d</span>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Most Active Day</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 truncate">
            {summary?.mostActiveDay || 'N/A'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Top Hobby</p>
          <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate">
            {summary?.topHabit || 'N/A'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Effort</p>
          <p className="text-lg font-bold text-amber-500 mt-1 flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-500" />
            <span>{summary?.avgEffort || 0} / 5</span>
          </p>
        </div>
      </div>

      {/* GitHub-Style 365-Day Activity Heatmap */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Yearly Activity (Last 365 Days)
            </h3>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span>Less</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((lvl) => (
                <div
                  key={lvl}
                  className={`w-3 h-3 rounded-xs ${getHeatmapColor(lvl)} border border-black/5 dark:border-white/5`}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2 scrollbar-none">
          <div className="inline-flex gap-1 p-1">
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col gap-1">
                {week.map((day) => (
                  <div
                    key={day.date}
                    onMouseEnter={() => setHoveredDay(day)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`w-3 h-3 rounded-xs transition-transform hover:scale-125 cursor-pointer ${getHeatmapColor(
                      day.level
                    )}`}
                    title={`${day.date}: ${day.count} check-ins (${day.totalAmount} logged)`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Hovered Day Status */}
        <div className="h-5 text-xs text-slate-500">
          {hoveredDay ? (
            <span>
              <strong>{hoveredDay.date}</strong>: {hoveredDay.count} check-ins completed (Total logged: {hoveredDay.totalAmount})
            </span>
          ) : (
            <span className="text-slate-400">Hover over any day square to see exact check-in volume.</span>
          )}
        </div>
      </div>

      {/* Charts Grid: Donut Breakdown (Left) & 12-Week Trends (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Donut */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Category Distribution
            </h3>
          </div>

          {breakdown.length === 0 ? (
            <p className="text-xs text-slate-400 py-12 text-center">No category data yet.</p>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-48 h-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdown}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {breakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#4F46E5'} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as BreakdownItem;
                          return (
                            <div className="p-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg">
                              <p className="font-bold">{data.name}</p>
                              <p>{data.count} sessions ({data.percentage}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend list */}
              <div className="space-y-2 flex-1 w-full text-xs">
                {breakdown.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-slate-700 dark:text-slate-300 font-medium truncate">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-slate-500 font-semibold">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 12-Week Trends Bar Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              12-Week Completion Volume
            </h3>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="weekLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as TrendWeek;
                      return (
                        <div className="p-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg">
                          <p className="font-bold">{data.weekLabel}</p>
                          <p>{data.completed} check-ins</p>
                          <p className="text-[10px] text-slate-400">{data.startDate} to {data.endDate}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="completed" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
