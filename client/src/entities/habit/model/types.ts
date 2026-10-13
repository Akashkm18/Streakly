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

export interface CheckInRecord {
  id?: string;
  date: string;
  count: number;
  isFrozenDay: boolean;
  journal?: {
    note?: string;
    mood: number;
    energy: number;
  } | null;
}

export interface PauseRecord {
  id?: string;
  startDate: string;
  endDate: string;
  reason: string;
  notes?: string;
  isActive: boolean;
}

export interface ComebackPlan {
  id: string;
  habitId: string;
  brokenStreak: number;
  targetDays: number;
  currentDay: number;
  restoredStreak: number;
  status: string;
  startDate: string;
}

export interface ForecastData {
  probabilityToday: number;
  probabilityTomorrow: number;
  weekdayBreakdown: {
    dayOfWeek: number;
    dayName: string;
    totalEligible: number;
    completed: number;
    completionRate: number;
  }[];
  dangerDays: {
    dayOfWeek: number;
    dayName: string;
    completionRate: number;
    missRate: number;
    message: string;
  }[];
  overallRate: number;
  coachingTip: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: string;
  customDays: number[];
  goalPerDay: number;
  createdAt: string;
  isArchived: boolean;
  stats: StreakStats;
  activeComebackPlan?: ComebackPlan | null;
  forecast?: ForecastData;
  recentCheckIns?: CheckInRecord[];
  pauses?: PauseRecord[];
}
