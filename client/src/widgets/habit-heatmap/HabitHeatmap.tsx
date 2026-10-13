import React from 'react';
import { CheckInRecord, PauseRecord } from '@/entities/habit/model/types';
import { subtractDays, formatDateDisplay } from '@/shared/lib/date';
import { Snowflake, Shield } from 'lucide-react';

export interface HabitHeatmapProps {
  checkIns: CheckInRecord[];
  pauses?: PauseRecord[];
  color?: string;
}

export const HabitHeatmap: React.FC<HabitHeatmapProps> = ({
  checkIns = [],
  pauses = [],
  color = '#f97316',
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const daysTotal = 90;

  // Build lookup maps
  const checkInsMap = new Map<string, CheckInRecord>();
  checkIns.forEach((c) => checkInsMap.set(c.date, c));

  const days = [];
  for (let i = daysTotal - 1; i >= 0; i--) {
    const dStr = subtractDays(todayStr, i);
    const checkIn = checkInsMap.get(dStr);
    const isPaused = pauses.some((p) => p.isActive && dStr >= p.startDate && dStr <= p.endDate);

    days.push({
      date: dStr,
      isCompleted: !!checkIn,
      isFrozen: checkIn?.isFrozenDay ?? false,
      isPaused,
    });
  }

  return (
    <div className="rounded-2xl glass-card p-5 border border-slate-800 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold font-heading text-white">90-Day Activity Heatmap</h4>
          <span className="text-[11px] text-slate-400">Streak timeline & protected dates</span>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
            <span>Freeze Token</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
            <span>Paused</span>
          </div>
        </div>
      </div>

      {/* Grid: 7 rows (days of week) across weeks */}
      <div className="overflow-x-auto pb-2">
        <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
          {days.map((day) => {
            let bgStyle: any = { backgroundColor: 'rgba(255, 255, 255, 0.05)' };
            let title = `${formatDateDisplay(day.date)}: Missed`;

            if (day.isFrozen) {
              bgStyle = { backgroundColor: '#22d3ee' }; // cyan
              title = `${formatDateDisplay(day.date)}: Shielded by Freeze Token ❄️`;
            } else if (day.isPaused) {
              bgStyle = { backgroundColor: '#0284c7' }; // sky blue
              title = `${formatDateDisplay(day.date)}: Smart Pause Active 🛡️`;
            } else if (day.isCompleted) {
              bgStyle = { backgroundColor: color };
              title = `${formatDateDisplay(day.date)}: Completed 🔥`;
            }

            return (
              <div
                key={day.date}
                title={title}
                className="w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 cursor-pointer relative"
                style={bgStyle}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
