/**
 * Date utility helpers for Ember.
 * All habit tracking dates are formatted as "YYYY-MM-DD" local calendar dates.
 */

export function getTodayString(timezone = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

export function formatLocalDate(date: Date, timezone = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

export function addDays(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split('T')[0];
}

export function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
}

export function daysBetween(dateStrA: string, dateStrB: string): number {
  const [y1, m1, d1] = dateStrA.split('-').map(Number);
  const [y2, m2, d2] = dateStrB.split('-').map(Number);
  const utcA = Date.UTC(y1, m1 - 1, d1);
  const utcB = Date.UTC(y2, m2 - 1, d2);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utcB - utcA) / msPerDay);
}

export function getDayOfWeek(dateStr: string): number {
  // Returns 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCDay();
}

export function isPastDate(dateStr: string, todayStr: string): boolean {
  return dateStr < todayStr;
}

export function isFutureDate(dateStr: string, todayStr: string): boolean {
  return dateStr > todayStr;
}

export function getWeekdayName(dayIndex: number): string {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[dayIndex] || 'Unknown';
}
