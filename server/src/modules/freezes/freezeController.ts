import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { BadRequestError } from '../../common/errors/AppError';
import { validateFreezeUsage } from '../streaklyEngines/freezeRestEngine';

export async function getFreezes(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const currentMonthKey = now.toISOString().slice(0, 7); // YYYY-MM

    const allFreezes = await prisma.freeze.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    const thisMonthFreezes = allFreezes.filter((f) => f.date.startsWith(currentMonthKey));
    const usedThisMonth = thisMonthFreezes.length;
    const maxPerMonth = 2;
    const remainingThisMonth = Math.max(0, maxPerMonth - usedThisMonth);

    res.json({
      data: {
        freezes: allFreezes,
        usedThisMonth,
        maxPerMonth,
        remainingThisMonth,
        currentMonthKey,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function useFreeze(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];
    const { date, reason } = req.body;
    const targetDate = date || today;

    const currentMonthKey = targetDate.slice(0, 7);

    // Get existing freezes for this month
    const existingFreezes = await prisma.freeze.findMany({
      where: {
        userId,
        date: { startsWith: currentMonthKey },
      },
    });

    const validation = validateFreezeUsage({
      targetDate,
      todayDate: today,
      existingFreezesThisMonth: existingFreezes.map((f) => f.date),
      maxMonthlyFreezes: 2,
    });

    if (!validation.allowed) {
      throw new BadRequestError(validation.error || 'Cannot use freeze');
    }

    const created = await prisma.freeze.create({
      data: {
        userId,
        date: targetDate,
        monthKey: currentMonthKey,
        reason: reason ? String(reason).trim() : 'Preserved streak via freeze',
      },
    });

    res.status(201).json({
      data: {
        freeze: created,
        remainingFreezes: validation.remainingFreezes,
        message: 'Streak freeze activated successfully.',
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}
