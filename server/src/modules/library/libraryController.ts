import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';
import { NotFoundError, BadRequestError } from '../../common/errors/AppError';

export async function getCategories(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { templates: true },
        },
      },
    });

    res.json({ data: categories, error: null });
  } catch (err) {
    next(err);
  }
}

export async function getLibrary(req: Request, res: Response, next: NextFunction) {
  try {
    const category = (req.query.category as string) || '';
    const q = ((req.query.q || req.query.search) as string) || '';

    const where: any = {};

    if (category && category.toLowerCase() !== 'all') {
      where.OR = [
        { categoryId: category },
        { category: { name: { equals: category } } },
      ];
    }

    if (q && q.trim()) {
      const searchTerm = q.trim();
      const searchConditions = [
        { name: { contains: searchTerm } },
        { description: { contains: searchTerm } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const templates = await prisma.hobbyTemplate.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });

    // Provide title, unit, defaultTarget aliases alongside name, defaultUnit, suggestedGoal
    const normalized = templates.map((t) => ({
      ...t,
      title: t.name,
      unit: t.defaultUnit,
      defaultTarget: t.suggestedGoal,
    }));

    res.json({ data: normalized, error: null });
  } catch (err) {
    next(err);
  }
}

export async function adoptHobbyTemplate(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const template = await prisma.hobbyTemplate.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!template) {
      throw new NotFoundError('Hobby template not found');
    }

    // Check if user already has an active habit with this name
    const existing = await prisma.habit.findFirst({
      where: { userId, title: template.name, isArchived: false },
    });

    if (existing) {
      return res.json({
        data: {
          habit: existing,
          alreadyExisted: true,
          message: `"${template.name}" is already in your active hobbies!`,
        },
        error: null,
      });
    }

    const habit = await prisma.habit.create({
      data: {
        userId,
        categoryId: template.categoryId,
        title: template.name,
        description: template.description,
        icon: template.icon,
        color: template.color,
        unit: template.defaultUnit,
        targetAmount: template.suggestedGoal,
        scheduleType: template.scheduleType,
        scheduleDays: template.defaultDays,
        timesPerWeek: template.defaultTimesPerWeek || 7,
      },
      include: { category: true },
    });

    res.status(201).json({
      data: {
        habit,
        alreadyExisted: false,
        message: `"${template.name}" added to your dashboard!`,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}
