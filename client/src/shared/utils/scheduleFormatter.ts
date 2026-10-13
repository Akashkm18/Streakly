const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DAY_TOKEN_MAP: Record<string, string> = {
  sun: 'Sun',
  sunday: 'Sun',
  '0': 'Sun',
  mon: 'Mon',
  monday: 'Mon',
  '1': 'Mon',
  tue: 'Tue',
  tuesday: 'Tue',
  '2': 'Tue',
  wed: 'Wed',
  wednesday: 'Wed',
  '3': 'Wed',
  thu: 'Thu',
  thursday: 'Thu',
  '4': 'Thu',
  fri: 'Fri',
  friday: 'Fri',
  '5': 'Fri',
  sat: 'Sat',
  saturday: 'Sat',
  '6': 'Sat',
};

export interface SchedulableItem {
  scheduleType?: string | null;
  scheduleDays?: any;
  defaultDays?: any;
  timesPerWeek?: number | null;
  defaultTimesPerWeek?: number | null;
}

export function formatSchedule(item?: SchedulableItem | null): string {
  if (!item || !item.scheduleType) return 'Daily';

  const type = item.scheduleType;

  if (type === 'EVERY_DAY') {
    return 'Daily';
  }

  if (type === 'TIMES_PER_WEEK') {
    const times = item.timesPerWeek || item.defaultTimesPerWeek || 3;
    return `${times}x / week`;
  }

  if (type === 'SPECIFIC_DAYS') {
    let daysRaw = item.scheduleDays || item.defaultDays;

    if (typeof daysRaw === 'string') {
      try {
        daysRaw = JSON.parse(daysRaw);
      } catch {
        daysRaw = daysRaw.split(',').map((s: string) => s.trim());
      }
    }

    if (Array.isArray(daysRaw) && daysRaw.length > 0) {
      const formatted = daysRaw
        .map((token) => {
          if (typeof token === 'number') {
            return DAY_NAMES[token] || null;
          }
          const clean = String(token).toLowerCase().trim();
          return DAY_TOKEN_MAP[clean] || null;
        })
        .filter(Boolean);

      if (formatted.length > 0) {
        return formatted.join(', ');
      }
    }
    return 'Mon, Wed, Fri';
  }

  return 'Custom';
}

export default formatSchedule;
