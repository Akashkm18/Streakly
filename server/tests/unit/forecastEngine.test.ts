import { describe, it, expect } from 'vitest';
import { computeStreakForecast } from '../../src/modules/forecast/forecastEngine.js';
import { subtractDays, getDayOfWeek } from '../../src/common/utils/date.js';

describe('Streak Forecast Engine Unit Tests', () => {
  it('identifies danger days when user frequently misses a specific day of the week', () => {
    const today = '2026-10-12'; // Monday
    const config = { frequency: 'DAILY' };
    const checkInDates = new Set<string>();

    // Simulate 60 days of history: completed all days except Sundays (dow = 0)
    for (let i = 1; i <= 60; i++) {
      const d = subtractDays(today, i);
      const dow = getDayOfWeek(d);
      if (dow !== 0) {
        checkInDates.add(d);
      }
    }

    const forecast = computeStreakForecast(today, checkInDates, config, 60);

    expect(forecast.dangerDays.length).toBeGreaterThan(0);
    const sundayDanger = forecast.dangerDays.find((d) => d.dayOfWeek === 0);
    expect(sundayDanger).toBeDefined();
    expect(sundayDanger?.dayName).toBe('Sunday');
    expect(sundayDanger?.completionRate).toBe(0);
    expect(sundayDanger?.missRate).toBe(100);
    expect(sundayDanger?.message).toContain('You miss Sundays 100% of the time');
  });

  it('calculates probability for today and tomorrow accurately based on history', () => {
    const today = '2026-10-12';
    const config = { frequency: 'DAILY' };
    const checkInDates = new Set<string>();

    // 100% completion in history
    for (let i = 1; i <= 30; i++) {
      const d = subtractDays(today, i);
      checkInDates.add(d);
    }

    const forecast = computeStreakForecast(today, checkInDates, config, 30);
    expect(forecast.probabilityToday).toBe(100);
    expect(forecast.probabilityTomorrow).toBe(100);
    expect(forecast.dangerDays.length).toBe(0);
  });
});
