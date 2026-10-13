export interface GoalProjectionInput {
  currentAmount: number;
  targetAmount: number;
  deadline: string; // YYYY-MM-DD
  startDate?: string; // YYYY-MM-DD (defaults to 14 days ago if not provided)
  todayDate: string; // YYYY-MM-DD
}

export type GoalStatus = 'COMPLETED' | 'ON_TRACK' | 'BEHIND';

export interface GoalProjectionResult {
  progressPct: number;
  daysLeft: number;
  currentDailyVelocity: number;
  requiredDailyVelocity: number;
  projectedFinishDate: string;
  status: GoalStatus;
  isCompleted: boolean;
}

/**
 * Calculates days difference between two YYYY-MM-DD dates (d2 - d1)
 */
function getDaysDiff(d1: string, d2: string): number {
  const t1 = new Date(d1).getTime();
  const t2 = new Date(d2).getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

/**
 * Adds days to date string
 */
function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Math.round(days));
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Project goal completion pace and status
 */
export function calculateGoalProjection(input: GoalProjectionInput): GoalProjectionResult {
  const { currentAmount, targetAmount, deadline, startDate, todayDate } = input;

  const isCompleted = currentAmount >= targetAmount;
  const progressPct = Math.min(100, Math.round((currentAmount / targetAmount) * 100));
  const remainingAmount = Math.max(0, targetAmount - currentAmount);

  const daysLeft = Math.max(0, getDaysDiff(todayDate, deadline));

  if (isCompleted) {
    return {
      progressPct: 100,
      daysLeft,
      currentDailyVelocity: 0,
      requiredDailyVelocity: 0,
      projectedFinishDate: todayDate,
      status: 'COMPLETED',
      isCompleted: true,
    };
  }

  // Calculate elapsed days
  const actualStartDate = startDate || addDaysToDate(todayDate, -14);
  const elapsedDays = Math.max(1, getDaysDiff(actualStartDate, todayDate));

  // Current pace (amount per day)
  const currentDailyVelocity = Math.max(0.01, currentAmount / elapsedDays);

  // Required pace to finish by deadline
  const requiredDailyVelocity = daysLeft > 0 ? remainingAmount / daysLeft : remainingAmount;

  // Days needed at current pace
  const daysNeeded = Math.ceil(remainingAmount / currentDailyVelocity);
  const projectedFinishDate = addDaysToDate(todayDate, daysNeeded);

  // Status determination
  const status: GoalStatus =
    daysLeft === 0
      ? 'BEHIND'
      : projectedFinishDate <= deadline || currentDailyVelocity >= requiredDailyVelocity * 0.95
      ? 'ON_TRACK'
      : 'BEHIND';

  return {
    progressPct,
    daysLeft,
    currentDailyVelocity: Math.round(currentDailyVelocity * 100) / 100,
    requiredDailyVelocity: Math.round(requiredDailyVelocity * 100) / 100,
    projectedFinishDate,
    status,
    isCompleted: false,
  };
}
