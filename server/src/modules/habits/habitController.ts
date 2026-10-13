import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { BadRequestError, NotFoundError } from '../../common/errors/AppError';
import { sanitizeText, sanitizeOptionalText } from '../../common/utils/sanitizer';
import {
  calculateScheduleStreak,
  isDateScheduled,
  ScheduleType,
} from '../streaklyEngines/scheduleStreakEngine';

export async function getHabits(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];

    const habits = await prisma.habit.findMany({
      where: { userId, isArchived: false },
      include: {
        category: true,
        checkIns: {
          orderBy: { date: 'desc' },
          take: 90,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const userFreezes = await prisma.freeze.findMany({
      where: { userId },
      select: { date: true },
    });
    const frozenDates = userFreezes.map((f) => f.date);

    const userRestDays = await prisma.restDay.findMany({
      where: { userId },
      select: { date: true },
    });
    const restDates = userRestDays.map((r) => r.date);

    const enriched = habits.map((h) => {
      const scheduleDays = h.scheduleDays ? JSON.parse(h.scheduleDays) : null;
      const checkInDates = h.checkIns.map((c) => c.date);
      const isTodayCompleted = checkInDates.includes(today);

      const streakData = calculateScheduleStreak({
        scheduleType: h.scheduleType as ScheduleType,
        scheduleDays,
        timesPerWeek: h.timesPerWeek,
        checkInDates,
        frozenDates,
        restDates,
        todayDate: today,
      });

      // Calculate 7-day total amount & 30-day total amount
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];

      let weekTotal = 0;
      let monthTotal = 0;
      for (const c of h.checkIns) {
        if (c.date >= sevenDaysStr) weekTotal += c.amount;
        if (c.date >= thirtyDaysStr) monthTotal += c.amount;
      }

      return {
        id: h.id,
        title: h.title,
        description: h.description,
        icon: h.icon,
        color: h.color,
        unit: h.unit,
        targetAmount: h.targetAmount,
        scheduleType: h.scheduleType,
        scheduleDays,
        timesPerWeek: h.timesPerWeek,
        currentStreak: streakData.currentStreak,
        longestStreak: Math.max(h.longestStreak, streakData.longestStreak),
        weeklyStreak: streakData.weeklyStreak,
        totalCheckIns: h.totalCheckIns,
        personalBestAmount: h.personalBestAmount,
        category: h.category,
        isTodayCompleted,
        isScheduledToday: streakData.isScheduledToday,
        weekTotal: Math.round(weekTotal * 10) / 10,
        monthTotal: Math.round(monthTotal * 10) / 10,
        createdAt: h.createdAt,
      };
    });

    res.json({ data: enriched, error: null });
  } catch (err) {
    next(err);
  }
}

export async function getHabitById(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const habit = await prisma.habit.findFirst({
      where: { id, userId },
      include: {
        category: true,
        checkIns: {
          orderBy: { date: 'desc' },
          take: 90,
        },
        goals: {
          orderBy: { deadline: 'asc' },
        },
        reminders: true,
      },
    });

    if (!habit) {
      throw new NotFoundError('Hobby not found');
    }

    const userFreezes = await prisma.freeze.findMany({
      where: { userId },
      select: { date: true },
    });
    const frozenDates = userFreezes.map((f) => f.date);

    const userRestDays = await prisma.restDay.findMany({
      where: { userId },
      select: { date: true },
    });
    const restDates = userRestDays.map((r) => r.date);

    const scheduleDays = habit.scheduleDays ? JSON.parse(habit.scheduleDays) : null;
    const checkInDates = habit.checkIns.map((c) => c.date);
    const isTodayCompleted = checkInDates.includes(today);

    const streakData = calculateScheduleStreak({
      scheduleType: habit.scheduleType as ScheduleType,
      scheduleDays,
      timesPerWeek: habit.timesPerWeek,
      checkInDates,
      frozenDates,
      restDates,
      todayDate: today,
    });

    // Compute weekly, monthly totals, and average daily amount
    let totalAllAmounts = 0;
    let weekTotal = 0;
    let monthTotal = 0;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysStr = sevenDaysAgo.toISOString().split('T')[0];

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];

    for (const c of habit.checkIns) {
      totalAllAmounts += c.amount;
      if (c.date >= sevenDaysStr) weekTotal += c.amount;
      if (c.date >= thirtyDaysStr) monthTotal += c.amount;
    }

    const dailyAverage =
      habit.checkIns.length > 0
        ? Math.round((totalAllAmounts / habit.checkIns.length) * 10) / 10
        : habit.targetAmount;

    // Filter check-ins with notes for session log timeline
    const sessionNotes = habit.checkIns
      .filter((c) => c.note && c.note.trim().length > 0)
      .map((c) => ({
        id: c.id,
        date: c.date,
        amount: c.amount,
        note: c.note,
        effort: c.effort,
      }));

    res.json({
      data: {
        ...habit,
        scheduleDays,
        currentStreak: streakData.currentStreak,
        longestStreak: Math.max(habit.longestStreak, streakData.longestStreak),
        weeklyStreak: streakData.weeklyStreak,
        isTodayCompleted,
        isScheduledToday: streakData.isScheduledToday,
        weekTotal: Math.round(weekTotal * 10) / 10,
        monthTotal: Math.round(monthTotal * 10) / 10,
        dailyAverage,
        sessionNotes,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function createHabit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const {
      title,
      description,
      categoryId,
      icon = 'sparkles',
      color = '#4F46E5',
      unit = 'mins',
      targetAmount = 1,
      scheduleType = 'EVERY_DAY',
      scheduleDays,
      timesPerWeek = 7,
    } = req.body;

    const cleanTitle = sanitizeText(title);
    if (!cleanTitle) {
      throw new BadRequestError('Title is required');
    }

    const habit = await prisma.habit.create({
      data: {
        userId,
        categoryId: categoryId || null,
        title: cleanTitle,
        description: sanitizeOptionalText(description) || null,
        icon,
        color,
        unit,
        targetAmount: Number(targetAmount) || 1,
        scheduleType,
        scheduleDays: scheduleDays ? JSON.stringify(scheduleDays) : null,
        timesPerWeek: Number(timesPerWeek) || 7,
      },
      include: { category: true },
    });

    res.status(201).json({ data: habit, error: null });
  } catch (err) {
    next(err);
  }
}

export async function updateHabit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const {
      title,
      description,
      categoryId,
      icon,
      color,
      unit,
      targetAmount,
      scheduleType,
      scheduleDays,
      timesPerWeek,
    } = req.body;

    const existing = await prisma.habit.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError('Hobby not found');
    }

    const updated = await prisma.habit.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: sanitizeText(title) }),
        ...(description !== undefined && { description: sanitizeOptionalText(description) || null }),
        ...(categoryId !== undefined && { categoryId }),
        ...(icon && { icon }),
        ...(color && { color }),
        ...(unit && { unit }),
        ...(targetAmount !== undefined && { targetAmount: Number(targetAmount) }),
        ...(scheduleType && { scheduleType }),
        ...(scheduleDays !== undefined && {
          scheduleDays: scheduleDays ? JSON.stringify(scheduleDays) : null,
        }),
        ...(timesPerWeek !== undefined && { timesPerWeek: Number(timesPerWeek) }),
      },
      include: { category: true },
    });

    res.json({ data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export async function archiveHabit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.habit.findFirst({ where: { id, userId } });
    if (!existing) {
      throw new NotFoundError('Hobby not found');
    }

    await prisma.habit.update({
      where: { id },
      data: { isArchived: true },
    });

    res.json({ data: { message: 'Hobby archived successfully' }, error: null });
  } catch (err) {
    next(err);
  }
}
