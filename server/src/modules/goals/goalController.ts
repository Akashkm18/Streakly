import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { BadRequestError, NotFoundError } from '../../common/errors/AppError';
import { calculateGoalProjection } from '../streaklyEngines/goalProjectionEngine';

export async function getGoals(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const today = new Date().toISOString().split('T')[0];

    const goals = await prisma.goal.findMany({
      where: { userId },
      include: {
        habit: {
          select: {
            id: true,
            title: true,
            icon: true,
            color: true,
            unit: true,
          },
        },
      },
      orderBy: { deadline: 'asc' },
    });

    const enriched = goals.map((g) => {
      const startDate = g.createdAt.toISOString().split('T')[0];
      const projection = calculateGoalProjection({
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount,
        deadline: g.deadline,
        startDate,
        todayDate: today,
      });

      return {
        id: g.id,
        habitId: g.habitId,
        habit: g.habit,
        title: g.title,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        unit: g.unit,
        deadline: g.deadline,
        isCompleted: g.isCompleted || projection.isCompleted,
        progressPct: projection.progressPct,
        daysLeft: projection.daysLeft,
        currentDailyVelocity: projection.currentDailyVelocity,
        requiredDailyVelocity: projection.requiredDailyVelocity,
        projectedFinishDate: projection.projectedFinishDate,
        status: projection.status,
        createdAt: g.createdAt,
      };
    });

    res.json({ data: enriched, error: null });
  } catch (err) {
    next(err);
  }
}

export async function createGoal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { habitId, title, targetAmount, unit, deadline, currentAmount } = req.body;

    if (!title || !title.trim()) {
      throw new BadRequestError('Goal title is required');
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      throw new BadRequestError('Target amount must be greater than zero');
    }
    if (!deadline) {
      throw new BadRequestError('Goal target deadline is required');
    }

    let habitUnit = unit;
    if (habitId) {
      const habit = await prisma.habit.findFirst({
        where: { id: habitId, userId },
      });
      if (habit && !habitUnit) {
        habitUnit = habit.unit;
      }
    }

    const goal = await prisma.goal.create({
      data: {
        userId,
        habitId: habitId || null,
        title: String(title).trim(),
        targetAmount: Number(targetAmount),
        currentAmount: Number(currentAmount) || 0,
        unit: habitUnit || 'reps',
        deadline: String(deadline).slice(0, 10),
      },
      include: {
        habit: {
          select: { id: true, title: true, icon: true, color: true },
        },
      },
    });

    res.status(201).json({ data: goal, error: null });
  } catch (err) {
    next(err);
  }
}

export async function updateGoal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { title, targetAmount, currentAmount, deadline, isCompleted } = req.body;

    const existing = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Goal not found');
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        title: title !== undefined ? String(title).trim() : existing.title,
        targetAmount: targetAmount !== undefined ? Number(targetAmount) : existing.targetAmount,
        currentAmount: currentAmount !== undefined ? Number(currentAmount) : existing.currentAmount,
        deadline: deadline !== undefined ? String(deadline).slice(0, 10) : existing.deadline,
        isCompleted: isCompleted !== undefined ? Boolean(isCompleted) : existing.isCompleted,
      },
      include: {
        habit: {
          select: { id: true, title: true, icon: true, color: true },
        },
      },
    });

    res.json({ data: updated, error: null });
  } catch (err) {
    next(err);
  }
}

export async function deleteGoal(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const existing = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      throw new NotFoundError('Goal not found');
    }

    await prisma.goal.delete({
      where: { id },
    });

    res.json({ data: { success: true, message: 'Goal deleted' }, error: null });
  } catch (err) {
    next(err);
  }
}
