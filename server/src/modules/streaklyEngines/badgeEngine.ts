export interface BadgeDefinition {
  key: string;
  name: string;
  description: string;
  icon: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export const STREAKLY_BADGES: BadgeDefinition[] = [
  {
    key: 'first-checkin',
    name: 'First Step',
    description: 'Logged your very first habit or hobby check-in.',
    icon: 'Sparkles',
    tier: 'BRONZE',
  },
  {
    key: 'streak-7',
    name: 'Momentum Builder',
    description: 'Maintained a solid 7-day streak.',
    icon: 'Flame',
    tier: 'BRONZE',
  },
  {
    key: 'perfect-week',
    name: 'Flawless Seven',
    description: 'Completed 100% of all scheduled days in a 7-day window.',
    icon: 'CheckCircle2',
    tier: 'SILVER',
  },
  {
    key: 'personal-record',
    name: 'Record Breaker',
    description: 'Beat your previous personal best single-session record.',
    icon: 'Trophy',
    tier: 'SILVER',
  },
  {
    key: 'streak-30',
    name: 'Habit Anchor',
    description: 'Reached a remarkable 30-day streak.',
    icon: 'Shield',
    tier: 'SILVER',
  },
  {
    key: '10-hobbies',
    name: 'Renaissance Mind',
    description: 'Cultivating 10 diverse hobbies across categories.',
    icon: 'Layers',
    tier: 'GOLD',
  },
  {
    key: 'streak-100',
    name: 'Century Master',
    description: 'Achieved an extraordinary 100-day streak.',
    icon: 'Award',
    tier: 'GOLD',
  },
  {
    key: 'streak-365',
    name: 'Year of Greatness',
    description: 'Completed an entire 365-day streak unbroken.',
    icon: 'Crown',
    tier: 'PLATINUM',
  },
];

export interface BadgeEvaluationInput {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  totalHobbiesCount: number;
  isNewPersonalRecord: boolean;
  scheduledDaysLast7Completed: number; // e.g. 7 out of 7
  scheduledDaysLast7Total: number;
  alreadyEarnedKeys: string[];
}

/**
 * Evaluates which badges the user qualifies for that have not yet been awarded
 */
export function evaluateBadges(input: BadgeEvaluationInput): BadgeDefinition[] {
  const {
    currentStreak,
    longestStreak,
    totalCheckIns,
    totalHobbiesCount,
    isNewPersonalRecord,
    scheduledDaysLast7Completed,
    scheduledDaysLast7Total,
    alreadyEarnedKeys,
  } = input;

  const earnedSet = new Set(alreadyEarnedKeys);
  const newlyEarned: BadgeDefinition[] = [];

  const maxStreak = Math.max(currentStreak, longestStreak);

  // 1. first-checkin
  if (!earnedSet.has('first-checkin') && totalCheckIns >= 1) {
    const b = STREAKLY_BADGES.find((b) => b.key === 'first-checkin');
    if (b) newlyEarned.push(b);
  }

  // 2. streak-7
  if (!earnedSet.has('streak-7') && maxStreak >= 7) {
    const b = STREAKLY_BADGES.find((b) => b.key === 'streak-7');
    if (b) newlyEarned.push(b);
  }

  // 3. perfect-week
  if (
    !earnedSet.has('perfect-week') &&
    scheduledDaysLast7Total >= 5 &&
    scheduledDaysLast7Completed >= scheduledDaysLast7Total
  ) {
    const b = STREAKLY_BADGES.find((b) => b.key === 'perfect-week');
    if (b) newlyEarned.push(b);
  }

  // 4. personal-record
  if (!earnedSet.has('personal-record') && isNewPersonalRecord) {
    const b = STREAKLY_BADGES.find((b) => b.key === 'personal-record');
    if (b) newlyEarned.push(b);
  }

  // 5. streak-30
  if (!earnedSet.has('streak-30') && maxStreak >= 30) {
    const b = STREAKLY_BADGES.find((b) => b.key === 'streak-30');
    if (b) newlyEarned.push(b);
  }

  // 6. 10-hobbies
  if (!earnedSet.has('10-hobbies') && totalHobbiesCount >= 10) {
    const b = STREAKLY_BADGES.find((b) => b.key === '10-hobbies');
    if (b) newlyEarned.push(b);
  }

  // 7. streak-100
  if (!earnedSet.has('streak-100') && maxStreak >= 100) {
    const b = STREAKLY_BADGES.find((b) => b.key === 'streak-100');
    if (b) newlyEarned.push(b);
  }

  // 8. streak-365
  if (!earnedSet.has('streak-365') && maxStreak >= 365) {
    const b = STREAKLY_BADGES.find((b) => b.key === 'streak-365');
    if (b) newlyEarned.push(b);
  }

  return newlyEarned;
}
