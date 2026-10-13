import { describe, it, expect } from 'vitest';
import {
  calculateStreakStats,
  calculateMomentumScore,
  calculateFlameLevel,
  isEligibleDay,
} from '../../src/modules/checkins/streakEngine.js';
import { subtractDays } from '../../src/common/utils/date.js';

describe('Streak Engine Unit Tests', () => {
  it('correctly calculates consecutive daily streak', () => {
    const today = '2026-10-12';
    const createdAt = '2026-10-01';
    const checkIns = [
      { date: '2026-10-08', isFrozenDay: false, count: 1 },
      { date: '2026-10-09', isFrozenDay: false, count: 1 },
      { date: '2026-10-10', isFrozenDay: false, count: 1 },
      { date: '2026-10-11', isFrozenDay: false, count: 1 },
      { date: '2026-10-12', isFrozenDay: false, count: 1 },
    ];
    const pauses: any[] = [];
    const config = { frequency: 'DAILY' };

    const stats = calculateStreakStats(today, createdAt, checkIns, pauses, config);
    expect(stats.currentStreak).toBe(5);
    expect(stats.longestStreak).toBe(5);
    expect(stats.isCompletedToday).toBe(true);
    expect(stats.isAtRiskToday).toBe(false);
    expect(stats.flameLevel).toBe(1);
  });

  it('keeps streak alive when today is not yet checked in, flagging as at-risk', () => {
    const today = '2026-10-12';
    const createdAt = '2026-10-01';
    const checkIns = [
      { date: '2026-10-09', isFrozenDay: false, count: 1 },
      { date: '2026-10-10', isFrozenDay: false, count: 1 },
      { date: '2026-10-11', isFrozenDay: false, count: 1 },
    ];
    const pauses: any[] = [];
    const config = { frequency: 'DAILY' };

    const stats = calculateStreakStats(today, createdAt, checkIns, pauses, config);
    expect(stats.currentStreak).toBe(3);
    expect(stats.isCompletedToday).toBe(false);
    expect(stats.isAtRiskToday).toBe(true);
    expect(stats.status).toBe('at_risk');
  });

  it('handles WEEKDAYS frequency ignoring weekends without breaking streak', () => {
    // 2026-10-09 is Friday, 2026-10-10 is Saturday, 2026-10-11 is Sunday, 2026-10-12 is Monday
    const today = '2026-10-12';
    const createdAt = '2026-10-01';
    const checkIns = [
      { date: '2026-10-08', isFrozenDay: false, count: 1 }, // Thu
      { date: '2026-10-09', isFrozenDay: false, count: 1 }, // Fri
      { date: '2026-10-12', isFrozenDay: false, count: 1 }, // Mon
    ];
    const pauses: any[] = [];
    const config = { frequency: 'WEEKDAYS' };

    const stats = calculateStreakStats(today, createdAt, checkIns, pauses, config);
    expect(stats.currentStreak).toBe(3);
  });

  it('preserves streak across active pause period', () => {
    const today = '2026-10-12';
    const createdAt = '2026-10-01';
    const checkIns = [
      { date: '2026-10-07', isFrozenDay: false, count: 1 },
      { date: '2026-10-08', isFrozenDay: false, count: 1 },
      { date: '2026-10-12', isFrozenDay: false, count: 1 },
    ];
    const pauses = [
      {
        startDate: '2026-10-09',
        endDate: '2026-10-11',
        isActive: true,
        reason: 'ILLNESS',
      },
    ];
    const config = { frequency: 'DAILY' };

    const stats = calculateStreakStats(today, createdAt, checkIns, pauses, config);
    expect(stats.currentStreak).toBe(3);
  });

  it('preserves streak with freeze token protected day', () => {
    const today = '2026-10-12';
    const createdAt = '2026-10-01';
    const checkIns = [
      { date: '2026-10-09', isFrozenDay: false, count: 1 },
      { date: '2026-10-10', isFrozenDay: true, count: 1 }, // Protected by freeze token!
      { date: '2026-10-11', isFrozenDay: false, count: 1 },
      { date: '2026-10-12', isFrozenDay: false, count: 1 },
    ];
    const pauses: any[] = [];
    const config = { frequency: 'DAILY' };

    const stats = calculateStreakStats(today, createdAt, checkIns, pauses, config);
    expect(stats.currentStreak).toBe(4);
  });

  it('computes momentum score smoothly degrading instead of cliff drop', () => {
    const today = '2026-10-12';
    const checkInsMap = new Map();
    // 27 out of 28 days completed, only missed yesterday (i = 1)
    for (let i = 0; i < 28; i++) {
      if (i !== 1) {
        const d = subtractDays(today, i);
        checkInsMap.set(d, { date: d, isFrozenDay: false, count: 1 });
      }
    }
    const pauses: any[] = [];
    const config = { frequency: 'DAILY' };

    const score = calculateMomentumScore(today, checkInsMap, pauses, config);
    // Even though streak was broken yesterday, momentum remains high (> 80)
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('determines flame levels correctly', () => {
    expect(calculateFlameLevel(0)).toBe(0);
    expect(calculateFlameLevel(3)).toBe(1);
    expect(calculateFlameLevel(7)).toBe(2);
    expect(calculateFlameLevel(35)).toBe(3);
    expect(calculateFlameLevel(120)).toBe(4);
    expect(calculateFlameLevel(400)).toBe(5);
  });
});
