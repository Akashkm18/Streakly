import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';

export async function exportCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const checkIns = await prisma.checkIn.findMany({
      where: { userId },
      include: {
        habit: {
          include: { category: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const headers = ['Date', 'Habit', 'Category', 'Amount', 'Unit', 'Effort (1-5)', 'Note'];
    const rows = checkIns.map((c) => {
      const escape = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      return [
        c.date,
        escape(c.habit.title),
        escape(c.habit.category?.name || 'General'),
        c.amount,
        escape(c.habit.unit),
        c.effort ?? '',
        escape(c.note ?? ''),
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const today = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="streakly-export-${today}.csv"`);
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}

export async function exportJson(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];

    const [user, habits, freezes, restDays, goals, userBadges, reminders] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          timezone: true,
          createdAt: true,
        },
      }),
      prisma.habit.findMany({
        where: { userId },
        include: {
          category: true,
          checkIns: {
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.freeze.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      prisma.restDay.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
      }),
      prisma.goal.findMany({
        where: { userId },
        include: { habit: true },
        orderBy: { deadline: 'asc' },
      }),
      prisma.userBadge.findMany({
        where: { userId },
        include: { badge: true },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.reminder.findMany({
        where: { userId },
        include: { habit: true },
      }),
    ]);

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      user,
      habits,
      freezes,
      restDays,
      goals,
      badges: userBadges,
      reminders,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="streakly-export-${today}.json"`);
    res.status(200).send(JSON.stringify(exportData, null, 2));
  } catch (err) {
    next(err);
  }
}

export async function getMonthlyReport(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const currentMonthKey = now.toISOString().slice(0, 7); // YYYY-MM
    const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    const habits = await prisma.habit.findMany({
      where: { userId, isArchived: false },
      include: {
        category: true,
        checkIns: {
          where: { date: { startsWith: currentMonthKey } },
          orderBy: { date: 'asc' },
        },
      },
    });

    const totalCheckInsThisMonth = habits.reduce((acc, h) => acc + h.checkIns.length, 0);

    const habitSummaries = habits.map((h) => {
      const monthAmount = h.checkIns.reduce((sum, c) => sum + c.amount, 0);
      return {
        id: h.id,
        title: h.title,
        category: h.category?.name || 'General',
        currentStreak: h.currentStreak,
        longestStreak: h.longestStreak,
        monthCheckIns: h.checkIns.length,
        monthAmount: Math.round(monthAmount * 10) / 10,
        unit: h.unit,
        personalBestAmount: h.personalBestAmount,
      };
    });

    const badgesEarned = await prisma.userBadge.findMany({
      where: {
        userId,
        earnedAt: {
          gte: new Date(`${currentMonthKey}-01T00:00:00.000Z`),
        },
      },
      include: { badge: true },
    });

    res.json({
      data: {
        user,
        month: monthName,
        monthKey: currentMonthKey,
        totalCheckInsThisMonth,
        habits: habitSummaries,
        badgesEarned: badgesEarned.map((b) => ({
          name: b.badge.name,
          description: b.badge.description,
          tier: b.badge.tier,
          earnedAt: b.earnedAt,
        })),
        generatedAt: new Date().toISOString(),
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}
