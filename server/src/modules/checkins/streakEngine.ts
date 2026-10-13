import {
  getDayOfWeek,
  subtractDays,
  daysBetween,
} from '../../common/utils/date.js';

export interface HabitFrequencyConfig {
  frequency: string; // DAILY, WEEKDAYS, WEEKENDS, CUSTOM
  customDays?: number[]; // [0..6]
}

export interface CheckInRecord {
  date: string;
  isFrozenDay: boolean;
  count: number;
}

export interface PauseRecord {
  startDate: string;
  endDate: string;
  isActive: boolean;
  reason?: string;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  momentumScore: number;
  flameLevel: number;
  isCompletedToday: boolean;
  isAtRiskToday: boolean;
  totalCheckIns: number;
  status: 'active' | 'at_risk' | 'paused' | 'broken';
  activePause?: PauseRecord;
}

export function isEligibleDay(dateStr: string, config: HabitFrequencyConfig): boolean {
  const day = getDayOfWeek(dateStr);
  switch (config.frequency) {
    case 'WEEKDAYS':
      return day >= 1 && day <= 5;
    case 'WEEKENDS':
      return day === 0 || day === 6;
    case 'CUSTOM':
      return (config.customDays || []).includes(day);
    case 'DAILY':
    default:
      return true;
  }
}

export function isDateInPause(dateStr: string, pauses: PauseRecord[]): PauseRecord | undefined {
  return pauses.find((p) => p.isActive && dateStr >= p.startDate && dateStr <= p.endDate);
}

export function calculateFlameLevel(streak: number): number {
  if (streak >= 365) return 5; // Eternal Flame
  if (streak >= 100) return 4; // Inferno
  if (streak >= 30) return 3;  // Roaring Fire
  if (streak >= 7) return 2;   // Blazing Ember
  if (streak >= 1) return 1;   // Ignited Spark
  return 0;                    // Extinguished / Dormant
}

/**
 * Calculates momentum score (0 to 100) using exponential recency decay over past 28 days.
 * Lambda = 0.099 gives a half-life of ~7 days.
 */
export function calculateMomentumScore(
  todayStr: string,
  checkInsMap: Map<string, CheckInRecord>,
  pauses: PauseRecord[],
  config: HabitFrequencyConfig
): number {
  const daysLookback = 28;
  const lambda = 0.099;
  let totalWeight = 0;
  let earnedWeight = 0;

  for (let i = 0; i < daysLookback; i++) {
    const targetDate = subtractDays(todayStr, i);
    const weight = Math.exp(-lambda * i);

    if (!isEligibleDay(targetDate, config)) {
      continue;
    }

    totalWeight += weight;

    const hasCheckIn = checkInsMap.has(targetDate);
    const isPaused = !!isDateInPause(targetDate, pauses);

    if (hasCheckIn || isPaused) {
      earnedWeight += weight;
    }
  }

  if (totalWeight === 0) return 0;
  const score = Math.round((earnedWeight / totalWeight) * 100);
  return Math.min(100, Math.max(0, score));
}

/**
 * Comprehensive streak calculation engine
 */
export function calculateStreakStats(
  todayStr: string,
  createdAtStr: string,
  checkIns: CheckInRecord[],
  pauses: PauseRecord[],
  config: HabitFrequencyConfig
): StreakStats {
  const checkInsMap = new Map<string, CheckInRecord>();
  checkIns.forEach((c) => checkInsMap.set(c.date, c));

  const isCompletedToday = checkInsMap.has(todayStr);
  const activePauseToday = isDateInPause(todayStr, pauses);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  let searchDate = todayStr;

  // If today is not completed and not paused, we start evaluating from yesterday
  if (!isCompletedToday && !activePauseToday) {
    searchDate = subtractDays(todayStr, 1);
  }

  // Traverse backward
  while (searchDate >= createdAtStr) {
    if (isEligibleDay(searchDate, config)) {
      const pause = isDateInPause(searchDate, pauses);
      if (pause) {
        // Paused days preserve streak without breaking
      } else if (checkInsMap.has(searchDate)) {
        currentStreak++;
      } else {
        // Missed day -> current streak ends
        break;
      }
    }
    searchDate = subtractDays(searchDate, 1);
  }

  // 2. Calculate Longest Streak
  let longestStreak = 0;
  let tempStreak = 0;
  const totalDays = Math.max(0, daysBetween(createdAtStr, todayStr));

  for (let i = totalDays; i >= 0; i--) {
    const dStr = subtractDays(todayStr, i);
    if (!isEligibleDay(dStr, config)) continue;

    const pause = isDateInPause(dStr, pauses);
    if (pause) {
      // pause maintains tempStreak
    } else if (checkInsMap.has(dStr)) {
      tempStreak++;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    } else {
      tempStreak = 0;
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // 3. Momentum Score
  const momentumScore = calculateMomentumScore(todayStr, checkInsMap, pauses, config);

  // 4. Flame Level
  const flameLevel = calculateFlameLevel(currentStreak);

  // 5. At Risk Today check:
  // Eligible day today, not completed yet, not paused, and currentStreak > 0
  const isEligibleToday = isEligibleDay(todayStr, config);
  const isAtRiskToday = isEligibleToday && !isCompletedToday && !activePauseToday && currentStreak > 0;

  // 6. Status determination
  let status: 'active' | 'at_risk' | 'paused' | 'broken' = 'active';
  if (activePauseToday) {
    status = 'paused';
  } else if (isAtRiskToday) {
    status = 'at_risk';
  } else if (currentStreak === 0 && !isCompletedToday) {
    status = 'broken';
  }

  return {
    currentStreak,
    longestStreak,
    momentumScore,
    flameLevel,
    isCompletedToday,
    isAtRiskToday,
    totalCheckIns: checkIns.length,
    status,
    activePause: activePauseToday,
  };
}
