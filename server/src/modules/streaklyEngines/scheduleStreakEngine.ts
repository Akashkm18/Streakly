export type ScheduleType = 'EVERY_DAY' | 'SPECIFIC_DAYS' | 'TIMES_PER_WEEK';

export const DAY_NAMES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export type DayName = typeof DAY_NAMES[number];

export interface ScheduleStreakInput {
  scheduleType: ScheduleType;
  scheduleDays?: string[] | null; // e.g. ['MON', 'WED', 'FRI']
  timesPerWeek?: number | null;
  checkInDates: string[]; // Set of YYYY-MM-DD
  frozenDates?: string[]; // Set of YYYY-MM-DD
  restDates?: string[]; // Set of YYYY-MM-DD
  todayDate: string; // YYYY-MM-DD
}

export interface ScheduleStreakResult {
  currentStreak: number;
  longestStreak: number;
  weeklyStreak: number;
  isScheduledToday: boolean;
}

/**
 * Format Date object to YYYY-MM-DD
 */
export function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get DayName from date string
 */
export function getDayName(dateStr: string): DayName {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return DAY_NAMES[date.getDay()];
}

/**
 * Add or subtract days from YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Determine if a specific date is scheduled for a habit
 */
export function isDateScheduled(
  dateStr: string,
  scheduleType: ScheduleType,
  scheduleDays?: string[] | null
): boolean {
  if (scheduleType === 'EVERY_DAY' || scheduleType === 'TIMES_PER_WEEK') {
    return true;
  }
  if (scheduleType === 'SPECIFIC_DAYS') {
    if (!scheduleDays || scheduleDays.length === 0) return true;
    const dayName = getDayName(dateStr);
    return scheduleDays.includes(dayName);
  }
  return true;
}

/**
 * Calculate streak considering schedules, rest days, freezes, and weekly goals
 */
export function calculateScheduleStreak(input: ScheduleStreakInput): ScheduleStreakResult {
  const {
    scheduleType,
    scheduleDays,
    timesPerWeek = 7,
    checkInDates,
    frozenDates = [],
    restDates = [],
    todayDate,
  } = input;

  const checkInSet = new Set(checkInDates);
  const freezeSet = new Set(frozenDates);
  const restSet = new Set(restDates);

  const isScheduledToday = isDateScheduled(todayDate, scheduleType, scheduleDays);

  // Check if today is completed/protected
  const isTodayCompleted =
    checkInSet.has(todayDate) || freezeSet.has(todayDate) || restSet.has(todayDate);

  let currentStreak = 0;
  // If today is scheduled and completed, start checking backwards from today
  // If today is scheduled but not yet completed, start checking backwards from yesterday
  // If today is NOT scheduled, start checking backwards from yesterday
  let cursorDate = isScheduledToday
    ? isTodayCompleted
      ? todayDate
      : addDays(todayDate, -1)
    : addDays(todayDate, -1);

  // Traverse backwards day by day to count current streak
  let keepGoing = true;
  let safetyLimit = 1000; // max lookback

  while (keepGoing && safetyLimit > 0) {
    safetyLimit--;
    const scheduled = isDateScheduled(cursorDate, scheduleType, scheduleDays);

    if (!scheduled) {
      // Non-scheduled days never break the streak! Just skip to previous day.
      cursorDate = addDays(cursorDate, -1);
      continue;
    }

    const completed =
      checkInSet.has(cursorDate) || freezeSet.has(cursorDate) || restSet.has(cursorDate);

    if (completed) {
      currentStreak++;
      cursorDate = addDays(cursorDate, -1);
    } else {
      // Missed a scheduled day without freeze or rest -> streak broken
      keepGoing = false;
    }
  }

  // Calculate weekly streak (for weekly goals / timesPerWeek)
  let weeklyStreak = 0;
  if (scheduleType === 'TIMES_PER_WEEK') {
    const targetPerWeek = timesPerWeek || 3;
    // Iterate through preceding calendar weeks
    let weekCursorEnd = todayDate;
    let weeksSafety = 52;

    while (weeksSafety > 0) {
      weeksSafety--;
      let countThisWeek = 0;
      for (let i = 0; i < 7; i++) {
        const d = addDays(weekCursorEnd, -i);
        if (checkInSet.has(d) || freezeSet.has(d) || restSet.has(d)) {
          countThisWeek++;
        }
      }

      if (countThisWeek >= targetPerWeek) {
        weeklyStreak++;
        weekCursorEnd = addDays(weekCursorEnd, -7);
      } else {
        break;
      }
    }
  }

  // Calculate longest historical streak
  let longestStreak = currentStreak;
  if (checkInDates.length > 0) {
    const sortedDates = [...checkInDates].sort();
    let tempStreak = 0;
    let lastDate: string | null = null;

    for (const d of sortedDates) {
      if (!lastDate) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round(
          (new Date(d).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          // Check if intervening days were unscheduled or frozen
          let allCovered = true;
          for (let step = 1; step < diffDays; step++) {
            const midDate = addDays(lastDate, step);
            const midScheduled = isDateScheduled(midDate, scheduleType, scheduleDays);
            const midProtected = freezeSet.has(midDate) || restSet.has(midDate);
            if (midScheduled && !midProtected) {
              allCovered = false;
              break;
            }
          }
          if (allCovered) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
      }
      lastDate = d;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    weeklyStreak,
    isScheduledToday,
  };
}
