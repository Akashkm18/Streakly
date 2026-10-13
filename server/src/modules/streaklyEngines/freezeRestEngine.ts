export interface FreezeValidationInput {
  targetDate: string; // YYYY-MM-DD
  todayDate: string; // YYYY-MM-DD
  existingFreezesThisMonth: string[]; // List of YYYY-MM-DD already frozen this month
  maxMonthlyFreezes?: number;
}

export interface FreezeValidationResult {
  allowed: boolean;
  remainingFreezes: number;
  monthKey: string;
  error?: string;
}

/**
 * Validates whether a freeze can be used on a given date
 */
export function validateFreezeUsage(input: FreezeValidationInput): FreezeValidationResult {
  const {
    targetDate,
    todayDate,
    existingFreezesThisMonth,
    maxMonthlyFreezes = 2,
  } = input;

  const monthKey = targetDate.slice(0, 7); // YYYY-MM

  // 1. Cannot freeze future dates
  if (targetDate > todayDate) {
    return {
      allowed: false,
      remainingFreezes: Math.max(0, maxMonthlyFreezes - existingFreezesThisMonth.length),
      monthKey,
      error: 'Cannot apply a streak freeze to a future date.',
    };
  }

  // 2. Cannot double-freeze the same date
  if (existingFreezesThisMonth.includes(targetDate)) {
    return {
      allowed: false,
      remainingFreezes: Math.max(0, maxMonthlyFreezes - existingFreezesThisMonth.length),
      monthKey,
      error: 'This date has already been frozen.',
    };
  }

  // 3. Enforce monthly limit (2 per month)
  if (existingFreezesThisMonth.length >= maxMonthlyFreezes) {
    return {
      allowed: false,
      remainingFreezes: 0,
      monthKey,
      error: `Monthly freeze limit reached (${maxMonthlyFreezes} per month).`,
    };
  }

  const remaining = maxMonthlyFreezes - existingFreezesThisMonth.length - 1;

  return {
    allowed: true,
    remainingFreezes: Math.max(0, remaining),
    monthKey,
  };
}

export interface RestDayValidationInput {
  targetDate: string; // YYYY-MM-DD
  todayDate: string; // YYYY-MM-DD
  reason?: string;
}

export interface RestDayValidationResult {
  allowed: boolean;
  error?: string;
}

/**
 * Validates planning a rest day in advance (e.g. sick, travel)
 */
export function validateRestDay(input: RestDayValidationInput): RestDayValidationResult {
  const { targetDate, reason } = input;

  if (!targetDate) {
    return { allowed: false, error: 'Rest day date is required.' };
  }

  if (!reason || reason.trim().length === 0) {
    return { allowed: false, error: 'Reason for rest day is required (e.g. Sick, Travel, Rest).' };
  }

  return { allowed: true };
}
