import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';

export async function getInsightsSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const habits = await prisma.habit.findMany({
      where: { userId, isArchived: false },
    });

    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });

    const totalCheckIns = checkIns.length;
    let maxStreak = 0;
    for (const h of habits) {
      if (h.longestStreak > maxStreak) maxStreak = h.longestStreak;
      if (h.currentStreak > maxStreak) maxStreak = h.currentStreak;
    }

    // Day of week distribution (0=Sun, 6=Sat)
    const dayCounts = [0, 0, 0, 0, 0, 0, 0];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    for (const c of checkIns) {
      const d = new Date(c.date).getDay();
      dayCounts[d]++;
    }

    let maxDayIndex = 0;
    for (let i = 1; i < 7; i++) {
      if (dayCounts[i] > dayCounts[maxDayIndex]) {
        maxDayIndex = i;
      }
    }
    const mostActiveDay = totalCheckIns > 0 ? dayNames[maxDayIndex] : 'N/A';

    // Top habit
    let topHabit = 'None yet';
    let topCount = 0;
    for (const h of habits) {
      if (h.totalCheckIns > topCount) {
        topCount = h.totalCheckIns;
        topHabit = h.title;
      }
    }

    // Average effort rating
    let totalEffort = 0;
    let effortCount = 0;
    for (const c of checkIns) {
      if (c.effort) {
        totalEffort += c.effort;
        effortCount++;
      }
    }
    const avgEffort = effortCount > 0 ? Math.round((totalEffort / effortCount) * 10) / 10 : 0;

    res.json({
      data: {
        totalCheckIns,
        activeHabitsCount: habits.length,
        longestStreak: maxStreak,
        mostActiveDay,
        topHabit,
        avgEffort,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function getHeatmap(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { habitId } = req.query;

    // Last 365 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 364);

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const whereClause: any = {
      userId,
      date: {
        gte: startStr,
        lte: endStr,
      },
    };

    if (habitId && typeof habitId === 'string') {
      whereClause.habitId = habitId;
    }

    const checkIns = await prisma.checkIn.findMany({
      where: whereClause,
      select: {
        date: true,
        amount: true,
      },
    });

    // Map by date
    const dateMap = new Map<string, { count: number; totalAmount: number }>();
    for (const c of checkIns) {
      const prev = dateMap.get(c.date) || { count: 0, totalAmount: 0 };
      dateMap.set(c.date, {
        count: prev.count + 1,
        totalAmount: prev.totalAmount + c.amount,
      });
    }

    // Generate daily entries for all 365 days
    const dailyData: { date: string; count: number; totalAmount: number; level: number }[] = [];
    const cur = new Date(startDate);

    while (cur <= endDate) {
      const dStr = cur.toISOString().split('T')[0];
      const entry = dateMap.get(dStr) || { count: 0, totalAmount: 0 };

      let level = 0;
      if (entry.count === 1) level = 1;
      else if (entry.count === 2) level = 2;
      else if (entry.count === 3) level = 3;
      else if (entry.count >= 4) level = 4;

      dailyData.push({
        date: dStr,
        count: entry.count,
        totalAmount: entry.totalAmount,
        level,
      });

      cur.setDate(cur.getDate() + 1);
    }

    res.json({
      data: dailyData,
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function getBreakdown(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    // Check-in activity grouped by category
    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
      include: {
        habit: {
          include: { category: true },
        },
      },
    });

    const categoryCounts = new Map<string, { name: string; color: string; count: number }>();

    for (const c of checkIns) {
      const cat = c.habit?.category;
      if (!cat) continue;
      const prev = categoryCounts.get(cat.id) || { name: cat.name, color: cat.color, count: 0 };
      categoryCounts.set(cat.id, {
        name: cat.name,
        color: cat.color,
        count: prev.count + 1,
      });
    }

    const total = checkIns.length;
    const breakdown = Array.from(categoryCounts.values()).map((c) => ({
      name: c.name,
      color: c.color,
      count: c.count,
      percentage: total > 0 ? Math.round((c.count / total) * 100) : 0,
    }));

    // Sort descending
    breakdown.sort((a, b) => b.count - a.count);

    res.json({
      data: breakdown,
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function getTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    // Last 12 weeks
    const weeks: { weekLabel: string; completed: number; startDate: string; endDate: string }[] = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
      const dEnd = new Date(today);
      dEnd.setDate(today.getDate() - i * 7);
      const dStart = new Date(dEnd);
      dStart.setDate(dEnd.getDate() - 6);

      const sStr = dStart.toISOString().split('T')[0];
      const eStr = dEnd.toISOString().split('T')[0];

      const count = await prisma.checkIn.count({
        where: {
          userId,
          date: { gte: sStr, lte: eStr },
        },
      });

      const label = `W-${12 - i}`;
      weeks.push({
        weekLabel: label,
        completed: count,
        startDate: sStr,
        endDate: eStr,
      });
    }

    res.json({
      data: weeks,
      error: null,
    });
  } catch (err) {
    next(err);
  }
}
