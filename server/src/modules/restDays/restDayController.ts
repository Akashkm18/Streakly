import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { BadRequestError, NotFoundError } from '../../common/errors/AppError';
import { validateRestDay } from '../streaklyEngines/freezeRestEngine';

export async function getRestDays(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const restDays = await prisma.restDay.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    res.json({ data: restDays, error: null });
  } catch (err) {
    next(err);
  }
}

export async function createRestDay(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];
    const { date, reason } = req.body;

    const validation = validateRestDay({
      targetDate: date,
      todayDate: today,
      reason,
    });

    if (!validation.allowed) {
      throw new BadRequestError(validation.error || 'Invalid rest day');
    }

    // Check if already declared for this date
    const existing = await prisma.restDay.findFirst({
      where: {
        userId,
        date,
      },
    });

    if (existing) {
      throw new BadRequestError('A rest day is already scheduled for this date');
    }

    const created = await prisma.restDay.create({
      data: {
        userId,
        date,
        reason: String(reason).trim(),
      },
    });

    res.status(201).json({
      data: created,
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteRestDay(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.restDay.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Rest day not found');
    }

    await prisma.restDay.delete({
      where: { id },
    });

    res.json({
      data: { success: true, message: 'Rest day removed' },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}
