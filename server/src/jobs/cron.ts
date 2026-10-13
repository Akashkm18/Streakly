import cron from 'node-cron';
import { prisma } from '../prisma';

export function initializeScheduledJobs() {
  // Evening Streak-at-Risk Notification Job (Every evening at 20:00 / 8:00 PM)
  cron.schedule('0 20 * * *', async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Find all active habits
      const habits = await prisma.habit.findMany({
        where: { isArchived: false },
        include: {
          user: true,
          checkIns: {
            where: { date: today },
          },
        },
      });

      const atRiskHabits = habits.filter((h) => h.checkIns.length === 0 && h.currentStreak > 0);

      if (atRiskHabits.length > 0) {
        console.log(`[Streakly Cron] Evening check: ${atRiskHabits.length} habits are at risk of losing their active streak today (${today}).`);
      }
    } catch (err) {
      console.error('[Streakly Cron] Error in evening streak-at-risk job:', err);
    }
  });

  console.log('✔ Streakly scheduled jobs initialized (evening streak-at-risk check at 20:00)');
}
