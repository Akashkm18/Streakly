import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../prisma';

export async function getBadges(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const allBadges = await prisma.badge.findMany({
      orderBy: { key: 'asc' },
    });

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
    });

    const userBadgeMap = new Map(userBadges.map((ub) => [ub.badgeId, ub.earnedAt]));

    const enriched = allBadges.map((badge) => {
      const earnedAt = userBadgeMap.get(badge.id) || null;
      return {
        id: badge.id,
        key: badge.key,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        tier: badge.tier,
        isUnlocked: Boolean(earnedAt),
        earnedAt,
      };
    });

    const unlockedCount = enriched.filter((b) => b.isUnlocked).length;

    res.json({
      data: {
        badges: enriched,
        total: allBadges.length,
        unlockedCount,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecentBadges(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;

    const recent = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
      take: 3,
    });

    res.json({
      data: recent.map((r) => ({
        id: r.badge.id,
        key: r.badge.key,
        name: r.badge.name,
        description: r.badge.description,
        icon: r.badge.icon,
        tier: r.badge.tier,
        earnedAt: r.earnedAt,
      })),
      error: null,
    });
  } catch (err) {
    next(err);
  }
}
