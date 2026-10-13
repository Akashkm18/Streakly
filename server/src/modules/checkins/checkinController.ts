import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { BadRequestError, NotFoundError } from '../../common/errors/AppError';
import {
  calculateScheduleStreak,
  ScheduleType,
} from '../streaklyEngines/scheduleStreakEngine';
import { evaluateBadges } from '../streaklyEngines/badgeEngine';

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id: habitId } = req.params;
    const { amount, note, effort } = req.body;
    const date = req.body.date || new Date().toISOString().split('T')[0];

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new NotFoundError('Hobby not found');
    }

    // Check if check-in already exists for this date
    const existing = await prisma.checkIn.findUnique({
      where: { habitId_date: { habitId, date } },
    });

    if (existing) {
      throw new BadRequestError('Already checked in for this date');
    }

    const checkInAmount = Number(amount) > 0 ? Number(amount) : habit.targetAmount;
    const checkInEffort = effort !== undefined && effort !== null ? Math.min(5, Math.max(1, Number(effort))) : null;

    // Create Check-In
    const checkInRecord = await prisma.checkIn.create({
      data: {
        userId,
        habitId,
        date,
        amount: checkInAmount,
        note: note ? String(note).trim() : null,
        effort: checkInEffort,
      },
    });

    // Check if new personal best amount achieved
    let isNewPersonalRecord = false;
    let newPersonalBest = habit.personalBestAmount;
    if (checkInAmount > habit.personalBestAmount) {
      isNewPersonalRecord = true;
      newPersonalBest = checkInAmount;
    }

    // Fetch all check-ins for streak recalculation
    const allHabitCheckIns = await prisma.checkIn.findMany({
      where: { habitId },
      select: { date: true },
    });
    const checkInDates = allHabitCheckIns.map((c) => c.date);

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

    const streakData = calculateScheduleStreak({
      scheduleType: habit.scheduleType as ScheduleType,
      scheduleDays,
      timesPerWeek: habit.timesPerWeek,
      checkInDates,
      frozenDates,
      restDates,
      todayDate: date,
    });

    const newCurrentStreak = streakData.currentStreak;
    const newLongestStreak = Math.max(habit.longestStreak, streakData.longestStreak);
    const newTotal = habit.totalCheckIns + 1;

    // Update habit
    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        currentStreak: newCurrentStreak,
        longestStreak: newLongestStreak,
        weeklyStreak: streakData.weeklyStreak,
        totalCheckIns: newTotal,
        personalBestAmount: newPersonalBest,
      },
      include: { category: true },
    });

    // Also update any goals tied to this habit
    const relatedGoals = await prisma.goal.findMany({
      where: { userId, habitId, isCompleted: false },
    });
    for (const g of relatedGoals) {
      const updatedGoalAmount = g.currentAmount + checkInAmount;
      const isCompleted = updatedGoalAmount >= g.targetAmount;
      await prisma.goal.update({
        where: { id: g.id },
        data: {
          currentAmount: updatedGoalAmount,
          isCompleted,
        },
      });
    }

    // Evaluate Badges
    const existingUserBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });
    const alreadyEarnedKeys = existingUserBadges.map((ub) => ub.badge.key);

    const allUserHabitsCount = await prisma.habit.count({
      where: { userId, isArchived: false },
    });

    // Calculate scheduled days in last 7 days completed for perfect-week badge
    let last7Completed = 0;
    const sevenDaysList: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(date);
      d.setDate(d.getDate() - i);
      sevenDaysList.push(d.toISOString().split('T')[0]);
    }
    const recentCheckIns = await prisma.checkIn.findMany({
      where: { userId, date: { in: sevenDaysList } },
    });
    const recentCheckInDates = new Set(recentCheckIns.map((c) => c.date));
    last7Completed = sevenDaysList.filter((d) => recentCheckInDates.has(d)).length;

    const newlyAwardedBadges = evaluateBadges({
      currentStreak: newCurrentStreak,
      longestStreak: newLongestStreak,
      totalCheckIns: newTotal,
      totalHobbiesCount: allUserHabitsCount,
      isNewPersonalRecord,
      scheduledDaysLast7Completed: last7Completed,
      scheduledDaysLast7Total: 7,
      alreadyEarnedKeys,
    });

    // Persist newly earned badges
    const awardedResult: any[] = [];
    for (const b of newlyAwardedBadges) {
      const badgeRecord = await prisma.badge.findUnique({ where: { key: b.key } });
      if (badgeRecord) {
        await prisma.userBadge.create({
          data: {
            userId,
            badgeId: badgeRecord.id,
            earnedAt: new Date(),
          },
        });
        awardedResult.push(badgeRecord);
      }
    }

    res.status(201).json({
      data: {
        checkIn: checkInRecord,
        habit: updatedHabit,
        isNewPersonalRecord,
        newlyEarnedBadges: awardedResult,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function undoCheckIn(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id: habitId, date } = req.params;

    const existing = await prisma.checkIn.findFirst({
      where: { habitId, userId, date },
    });

    if (!existing) {
      throw new NotFoundError('Check-in record for this date not found');
    }

    await prisma.checkIn.delete({
      where: { id: existing.id },
    });

    const habit = await prisma.habit.findUnique({ where: { id: habitId } });
    if (habit) {
      const allCheckIns = await prisma.checkIn.findMany({
        where: { habitId },
        select: { date: true },
      });
      const checkInDates = allCheckIns.map((c) => c.date);

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
      const today = new Date().toISOString().split('T')[0];

      const streakData = calculateScheduleStreak({
        scheduleType: habit.scheduleType as ScheduleType,
        scheduleDays,
        timesPerWeek: habit.timesPerWeek,
        checkInDates,
        frozenDates,
        restDates,
        todayDate: today,
      });

      const updated = await prisma.habit.update({
        where: { id: habitId },
        data: {
          currentStreak: streakData.currentStreak,
          weeklyStreak: streakData.weeklyStreak,
          totalCheckIns: Math.max(0, habit.totalCheckIns - 1),
        },
      });

      return res.json({ data: { message: 'Check-in undone successfully', habit: updated }, error: null });
    }

    res.json({ data: { message: 'Check-in undone successfully' }, error: null });
  } catch (err) {
    next(err);
  }
}
