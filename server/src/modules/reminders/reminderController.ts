import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { BadRequestError, NotFoundError } from '../../common/errors/AppError';

export async function getReminders(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const reminders = await prisma.reminder.findMany({
      where: { userId },
      include: {
        habit: {
          select: {
            id: true,
            title: true,
            icon: true,
            color: true,
          },
        },
      },
      orderBy: { reminderTime: 'asc' },
    });

    res.json({ data: reminders, error: null });
  } catch (err) {
    next(err);
  }
}

export async function upsertReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { habitId, reminderTime, isEnabled } = req.body;

    if (!habitId) {
      throw new BadRequestError('Habit ID is required');
    }
    if (!reminderTime || !/^\d{2}:\d{2}$/.test(reminderTime)) {
      throw new BadRequestError('Valid reminder time in HH:MM format is required');
    }

    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
    });

    if (!habit) {
      throw new NotFoundError('Habit not found');
    }

    const reminder = await prisma.reminder.upsert({
      where: {
        userId_habitId: {
          userId,
          habitId,
        },
      },
      update: {
        reminderTime,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
      },
      create: {
        userId,
        habitId,
        reminderTime,
        isEnabled: isEnabled !== undefined ? Boolean(isEnabled) : true,
      },
      include: {
        habit: {
          select: { id: true, title: true, icon: true, color: true },
        },
      },
    });

    res.json({ data: reminder, error: null });
  } catch (err) {
    next(err);
  }
}

export async function deleteReminder(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.reminder.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Reminder not found');
    }

    await prisma.reminder.delete({
      where: { id },
    });

    res.json({ data: { success: true, message: 'Reminder deleted' }, error: null });
  } catch (err) {
    next(err);
  }
}
