import React from 'react';
import { ForecastData } from '@/entities/habit/model/types';
import { Sparkles, AlertTriangle, TrendingUp, Calendar } from 'lucide-react';

export interface ForecastWidgetProps {
  forecast: ForecastData | null;
  habitName?: string;
}

export const ForecastWidget: React.FC<ForecastWidgetProps> = ({ forecast, habitName }) => {
  if (!forecast) return null;

  return (
    <div className="rounded-2xl glass-card p-5 border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-ember-500/10 border border-ember-500/20 flex items-center justify-center text-ember-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold font-heading text-white">
              Streak Forecast {habitName ? `— ${habitName}` : ''}
            </h4>
            <span className="text-[11px] text-slate-400">Empirical weekday completion odds</span>
          </div>
        </div>

        {/* Overall Completion Rate */}
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
          {forecast.overallRate}% 90d Average
        </span>
      </div>

      {/* Probability Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Today's Odds
          </span>
          <span className="text-2xl font-black font-heading text-emerald-400 block mt-0.5">
            {forecast.probabilityToday}%
          </span>
          <span className="text-[10px] text-slate-500">Historical performance</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Tomorrow's Odds
          </span>
          <span className="text-2xl font-black font-heading text-amber-400 block mt-0.5">
            {forecast.probabilityTomorrow}%
          </span>
          <span className="text-[10px] text-slate-500">Expected consistency</span>
        </div>
      </div>

      {/* Weekday Breakdown Mini Bars */}
      <div>
        <span className="text-[11px] font-semibold text-slate-400 block mb-2">
          Weekday Completion Rates
        </span>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {forecast.weekdayBreakdown.map((item) => {
            const isDanger = item.completionRate < 65 && item.totalEligible >= 3;
            return (
              <div key={item.dayOfWeek} className="flex flex-col items-center gap-1">
                <div className="w-full h-16 bg-slate-950 rounded-lg flex flex-col justify-end p-1 overflow-hidden border border-slate-850">
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${
                      isDanger
                        ? 'bg-red-500/80 shadow-sm'
                        : item.completionRate >= 80
                        ? 'bg-emerald-500/80'
                        : 'bg-amber-500/80'
                    }`}
                    style={{ height: `${Math.max(15, item.completionRate)}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {item.dayName.slice(0, 3)}
                </span>
                <span className="text-[9px] text-slate-500">{item.completionRate}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Danger Day Alert Box */}
      {forecast.dangerDays.length > 0 ? (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h5 className="text-xs font-bold text-red-300">Danger Day Detected</h5>
            <p className="text-[11px] text-red-200/80 mt-0.5">
              {forecast.dangerDays[0].message}
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800 flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{forecast.coachingTip}</span>
        </div>
      )}
    </div>
  );
};
