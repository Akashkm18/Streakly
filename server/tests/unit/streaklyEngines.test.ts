import { describe, it, expect } from 'vitest';
import {
  calculateScheduleStreak,
  isDateScheduled,
  addDays,
} from '../../src/modules/streaklyEngines/scheduleStreakEngine';
import {
  validateFreezeUsage,
  validateRestDay,
} from '../../src/modules/streaklyEngines/freezeRestEngine';
import { calculateGoalProjection } from '../../src/modules/streaklyEngines/goalProjectionEngine';
import { evaluateBadges } from '../../src/modules/streaklyEngines/badgeEngine';

describe('1. Schedule-Aware Streak Engine', () => {
  it('correctly calculates daily schedule streak', () => {
    const res = calculateScheduleStreak({
      scheduleType: 'EVERY_DAY',
      todayDate: '2026-10-15',
      checkInDates: ['2026-10-13', '2026-10-14', '2026-10-15'],
    });
    expect(res.currentStreak).toBe(3);
    expect(res.isScheduledToday).toBe(true);
  });

  it('skips non-scheduled days on specific weekdays without breaking streak', () => {
    // Mon / Wed / Fri schedule
    // 2026-10-12 was Monday (checked in)
    // 2026-10-13 was Tuesday (not scheduled!)
    // 2026-10-14 was Wednesday (checked in)
    // 2026-10-15 was Thursday (not scheduled!)
    // 2026-10-16 was Friday (checked in)
    const res = calculateScheduleStreak({
      scheduleType: 'SPECIFIC_DAYS',
      scheduleDays: ['MON', 'WED', 'FRI'],
      todayDate: '2026-10-16',
      checkInDates: ['2026-10-12', '2026-10-14', '2026-10-16'],
    });

    expect(res.currentStreak).toBe(3);
    expect(res.isScheduledToday).toBe(true);
  });

  it('protects missed scheduled day when freeze is applied', () => {
    const res = calculateScheduleStreak({
      scheduleType: 'EVERY_DAY',
      todayDate: '2026-10-15',
      checkInDates: ['2026-10-13', '2026-10-15'],
      frozenDates: ['2026-10-14'], // Day 14 missed but frozen!
    });
    expect(res.currentStreak).toBe(3);
  });

  it('handles cross-month and leap-day dates correctly', () => {
    // 2024 was a leap year (Feb 29 exists)
    const d1 = addDays('2024-02-28', 1);
    expect(d1).toBe('2024-02-29');
    const d2 = addDays('2024-02-29', 1);
    expect(d2).toBe('2024-03-01');

    const res = calculateScheduleStreak({
      scheduleType: 'EVERY_DAY',
      todayDate: '2024-03-01',
      checkInDates: ['2024-02-28', '2024-02-29', '2024-03-01'],
    });
    expect(res.currentStreak).toBe(3);
  });

  it('calculates weekly streak for times-per-week hobbies', () => {
    // 3 times per week requirement
    const res = calculateScheduleStreak({
      scheduleType: 'TIMES_PER_WEEK',
      timesPerWeek: 3,
      todayDate: '2026-10-15',
      checkInDates: [
        '2026-10-09',
        '2026-10-11',
        '2026-10-13',
        '2026-10-14',
        '2026-10-15',
      ],
    });
    expect(res.weeklyStreak).toBeGreaterThanOrEqual(1);
  });
});

describe('2. Freeze and Rest Day Validation Engine', () => {
  it('allows up to 2 freezes in a calendar month', () => {
    const firstUse = validateFreezeUsage({
      targetDate: '2026-10-10',
      todayDate: '2026-10-12',
      existingFreezesThisMonth: [],
    });
    expect(firstUse.allowed).toBe(true);
    expect(firstUse.remainingFreezes).toBe(1);

    const secondUse = validateFreezeUsage({
      targetDate: '2026-10-11',
      todayDate: '2026-10-12',
      existingFreezesThisMonth: ['2026-10-10'],
    });
    expect(secondUse.allowed).toBe(true);
    expect(secondUse.remainingFreezes).toBe(0);
  });

  it('blocks 3rd freeze attempt in the same calendar month', () => {
    const thirdAttempt = validateFreezeUsage({
      targetDate: '2026-10-12',
      todayDate: '2026-10-12',
      existingFreezesThisMonth: ['2026-10-05', '2026-10-08'],
    });
    expect(thirdAttempt.allowed).toBe(false);
    expect(thirdAttempt.error).toContain('limit reached');
  });

  it('prevents freezing future dates', () => {
    const futureAttempt = validateFreezeUsage({
      targetDate: '2026-10-20',
      todayDate: '2026-10-12',
      existingFreezesThisMonth: [],
    });
    expect(futureAttempt.allowed).toBe(false);
    expect(futureAttempt.error).toContain('future date');
  });

  it('validates advance rest day scheduling', () => {
    const valid = validateRestDay({
      targetDate: '2026-10-25',
      todayDate: '2026-10-12',
      reason: 'Travel Conference',
    });
    expect(valid.allowed).toBe(true);

    const missingReason = validateRestDay({
      targetDate: '2026-10-25',
      todayDate: '2026-10-12',
      reason: '',
    });
    expect(missingReason.allowed).toBe(false);
  });
});

describe('3. Goal Projection Engine', () => {
  it('calculates on-track status when velocity meets deadline requirement', () => {
    // Read 10 books in 30 days. Day 15: already read 6 books -> on track!
    const res = calculateGoalProjection({
      currentAmount: 6,
      targetAmount: 10,
      startDate: '2026-10-01',
      todayDate: '2026-10-15',
      deadline: '2026-10-30',
    });

    expect(res.progressPct).toBe(60);
    expect(res.daysLeft).toBe(15);
    expect(res.status).toBe('ON_TRACK');
    expect(res.projectedFinishDate <= '2026-10-30').toBe(true);
  });

  it('flags behind status when pace is too slow', () => {
    // Target: 100 km in 20 days. Day 15: only 10 km completed.
    const res = calculateGoalProjection({
      currentAmount: 10,
      targetAmount: 100,
      startDate: '2026-10-01',
      todayDate: '2026-10-15',
      deadline: '2026-10-20',
    });

    expect(res.progressPct).toBe(10);
    expect(res.status).toBe('BEHIND');
  });

  it('returns completed status when target is reached', () => {
    const res = calculateGoalProjection({
      currentAmount: 12,
      targetAmount: 10,
      todayDate: '2026-10-15',
      deadline: '2026-10-30',
    });
    expect(res.isCompleted).toBe(true);
    expect(res.status).toBe('COMPLETED');
    expect(res.progressPct).toBe(100);
  });
});

describe('4. Badge Milestone Engine', () => {
  it('awards first-checkin and streak-7 badges when criteria met', () => {
    const awarded = evaluateBadges({
      currentStreak: 7,
      longestStreak: 7,
      totalCheckIns: 7,
      totalHobbiesCount: 2,
      isNewPersonalRecord: false,
      scheduledDaysLast7Completed: 7,
      scheduledDaysLast7Total: 7,
      alreadyEarnedKeys: [],
    });

    const keys = awarded.map((b) => b.key);
    expect(keys).toContain('first-checkin');
    expect(keys).toContain('streak-7');
    expect(keys).toContain('perfect-week');
  });

  it('awards personal-record badge when new record is logged', () => {
    const awarded = evaluateBadges({
      currentStreak: 3,
      longestStreak: 5,
      totalCheckIns: 10,
      totalHobbiesCount: 3,
      isNewPersonalRecord: true,
      scheduledDaysLast7Completed: 3,
      scheduledDaysLast7Total: 7,
      alreadyEarnedKeys: ['first-checkin'],
    });

    const keys = awarded.map((b) => b.key);
    expect(keys).toContain('personal-record');
    expect(keys).not.toContain('first-checkin'); // already earned
  });
});
