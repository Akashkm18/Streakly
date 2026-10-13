import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { STREAKLY_BADGES } from '../src/modules/streaklyEngines/badgeEngine';

const prisma = new PrismaClient();

async function main() {
  console.log('⚡ Seeding Streakly database (idempotent upsert)...');

  // 1. Seed 8 Categories (idempotent upsert)
  const categoryDefs = [
    { name: 'Fitness', icon: 'Dumbbell', color: '#10B981', order: 1 },
    { name: 'Learning', icon: 'BookOpen', color: '#3B82F6', order: 2 },
    { name: 'Creative', icon: 'Palette', color: '#8B5CF6', order: 3 },
    { name: 'Music', icon: 'Music', color: '#EC4899', order: 4 },
    { name: 'Mind', icon: 'Brain', color: '#06B6D4', order: 5 },
    { name: 'Health', icon: 'HeartPulse', color: '#F43F5E', order: 6 },
    { name: 'Productivity', icon: 'Target', color: '#F59E0B', order: 7 },
    { name: 'Social & Life', icon: 'Users', color: '#6366F1', order: 8 },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoryDefs) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: { icon: cat.icon, color: cat.color, order: cat.order },
      create: cat,
    });
    categoryMap.set(cat.name, created.id);
  }
  console.log('✔ 8 Categories synced');

  // 2. Seed 40 Curated Hobby Templates
  const templateDefs = [
    // Fitness (7)
    {
      cat: 'Fitness',
      name: 'Gym Workout',
      description: 'Strength training, resistance workouts, or hypertrophy sessions',
      icon: 'Dumbbell',
      color: '#10B981',
      defaultUnit: 'mins',
      suggestedGoal: 45,
      scheduleType: 'SPECIFIC_DAYS',
      defaultDays: JSON.stringify(['MON', 'WED', 'FRI']),
    },
    {
      cat: 'Fitness',
      name: 'Running',
      description: 'Morning or evening runs for aerobic endurance',
      icon: 'Footprints',
      color: '#10B981',
      defaultUnit: 'km',
      suggestedGoal: 5,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 3,
    },
    {
      cat: 'Fitness',
      name: 'Daily Walking',
      description: 'Brisk outdoor walk to clear the mind and hit step targets',
      icon: 'Activity',
      color: '#10B981',
      defaultUnit: 'steps',
      suggestedGoal: 8000,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Fitness',
      name: 'Yoga & Mobility',
      description: 'Mindful stretching, vinyasa flow, and hip opening',
      icon: 'Heart',
      color: '#10B981',
      defaultUnit: 'mins',
      suggestedGoal: 20,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Fitness',
      name: 'Cycling',
      description: 'Road cycling, mountain trail or stationary peloton',
      icon: 'Bike',
      color: '#10B981',
      defaultUnit: 'km',
      suggestedGoal: 15,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 2,
    },
    {
      cat: 'Fitness',
      name: 'Swimming',
      description: 'Lap swimming for low-impact full-body conditioning',
      icon: 'Waves',
      color: '#10B981',
      defaultUnit: 'laps',
      suggestedGoal: 20,
      scheduleType: 'SPECIFIC_DAYS',
      defaultDays: JSON.stringify(['TUE', 'THU']),
    },
    {
      cat: 'Fitness',
      name: 'Stretching & Foam Rolling',
      description: 'Post-work recovery routine to prevent muscle stiffness',
      icon: 'Smile',
      color: '#10B981',
      defaultUnit: 'mins',
      suggestedGoal: 10,
      scheduleType: 'EVERY_DAY',
    },

    // Learning (5)
    {
      cat: 'Learning',
      name: 'Book Reading',
      description: 'Non-fiction, biography, or high-signal literature reading',
      icon: 'BookOpen',
      color: '#3B82F6',
      defaultUnit: 'pages',
      suggestedGoal: 20,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Learning',
      name: 'Coding Practice',
      description: 'Building software projects, solving algorithms, or learning a stack',
      icon: 'Code2',
      color: '#3B82F6',
      defaultUnit: 'mins',
      suggestedGoal: 45,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Learning',
      name: 'Language Learning',
      description: 'Daily vocabulary, flashcards, or spoken conversation drills',
      icon: 'Languages',
      color: '#3B82F6',
      defaultUnit: 'mins',
      suggestedGoal: 15,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Learning',
      name: 'Online Course & Lectures',
      description: 'Structured progress through an engineering or business course',
      icon: 'GraduationCap',
      color: '#3B82F6',
      defaultUnit: 'lessons',
      suggestedGoal: 1,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 3,
    },
    {
      cat: 'Learning',
      name: 'Math & Logic Puzzles',
      description: 'Brain teasers, probability problems, or chess puzzles',
      icon: 'Binary',
      color: '#3B82F6',
      defaultUnit: 'problems',
      suggestedGoal: 3,
      scheduleType: 'EVERY_DAY',
    },

    // Creative (6)
    {
      cat: 'Creative',
      name: 'Drawing & Sketching',
      description: 'Hand sketching, digital illustration, or anatomy studies',
      icon: 'PenTool',
      color: '#8B5CF6',
      defaultUnit: 'mins',
      suggestedGoal: 30,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Creative',
      name: 'Painting',
      description: 'Watercolor, gouache, or acrylic painting exploration',
      icon: 'Palette',
      color: '#8B5CF6',
      defaultUnit: 'mins',
      suggestedGoal: 45,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 2,
    },
    {
      cat: 'Creative',
      name: 'Photography Walk',
      description: 'Taking photos with mindful composition and editing',
      icon: 'Camera',
      color: '#8B5CF6',
      defaultUnit: 'photos',
      suggestedGoal: 5,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 2,
    },
    {
      cat: 'Creative',
      name: 'Creative Writing',
      description: 'Writing essays, fiction chapters, or poetry drafts',
      icon: 'Feather',
      color: '#8B5CF6',
      defaultUnit: 'words',
      suggestedGoal: 500,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Creative',
      name: 'Daily Journaling',
      description: 'Reflective evening journaling, brain dumps, or logs',
      icon: 'FileText',
      color: '#8B5CF6',
      defaultUnit: 'entry',
      suggestedGoal: 1,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Creative',
      name: 'Video & Audio Editing',
      description: 'Crafting creative video clips, podcasts, or soundscapes',
      icon: 'Video',
      color: '#8B5CF6',
      defaultUnit: 'mins',
      suggestedGoal: 30,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 3,
    },

    // Music (4)
    {
      cat: 'Music',
      name: 'Guitar Practice',
      description: 'Scales, chord transitions, fingerpicking, and song covers',
      icon: 'Music',
      color: '#EC4899',
      defaultUnit: 'mins',
      suggestedGoal: 20,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Music',
      name: 'Piano Practice',
      description: 'Sight reading, two-handed coordination, and classical pieces',
      icon: 'Music2',
      color: '#EC4899',
      defaultUnit: 'mins',
      suggestedGoal: 25,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Music',
      name: 'Vocal Warmups & Singing',
      description: 'Breathing exercises, pitch control, and vocal repertoire',
      icon: 'Mic',
      color: '#EC4899',
      defaultUnit: 'mins',
      suggestedGoal: 15,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Music',
      name: 'Drumming & Rhythm',
      description: 'Rudiments, metronome tempo training, and groove pocket',
      icon: 'Disc',
      color: '#EC4899',
      defaultUnit: 'mins',
      suggestedGoal: 20,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 3,
    },

    // Mind (4)
    {
      cat: 'Mind',
      name: 'Mindfulness Meditation',
      description: 'Silent sitting, breath awareness, or guided meditation',
      icon: 'Brain',
      color: '#06B6D4',
      defaultUnit: 'mins',
      suggestedGoal: 15,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Mind',
      name: 'Gratitude Reflection',
      description: 'Noting down three specific things you are grateful for',
      icon: 'Sparkles',
      color: '#06B6D4',
      defaultUnit: 'items',
      suggestedGoal: 3,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Mind',
      name: 'Digital Detox Hours',
      description: 'Zero phone and zero social media block before bedtime',
      icon: 'ShieldOff',
      color: '#06B6D4',
      defaultUnit: 'hours',
      suggestedGoal: 2,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Mind',
      name: 'Sleep on Time by 11 PM',
      description: 'Maintaining a consistent circadian bedtime rhythm',
      icon: 'Moon',
      color: '#06B6D4',
      defaultUnit: 'session',
      suggestedGoal: 1,
      scheduleType: 'EVERY_DAY',
    },

    // Health (4)
    {
      cat: 'Health',
      name: 'Drink 8 Glasses of Water',
      description: 'Consistent hydration throughout morning and afternoon',
      icon: 'Droplets',
      color: '#F43F5E',
      defaultUnit: 'glasses',
      suggestedGoal: 8,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Health',
      name: 'Healthy Home Meal',
      description: 'Cooking whole foods rich in protein and fresh greens',
      icon: 'Utensils',
      color: '#F43F5E',
      defaultUnit: 'meals',
      suggestedGoal: 2,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Health',
      name: 'Daily Vitamins & Supplements',
      description: 'Taking morning omega-3, vitamin D, and essential minerals',
      icon: 'Pill',
      color: '#F43F5E',
      defaultUnit: 'dose',
      suggestedGoal: 1,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Health',
      name: 'Zero Added Sugar Day',
      description: 'Avoiding sugary sodas, candies, and processed desserts',
      icon: 'CheckCircle',
      color: '#F43F5E',
      defaultUnit: 'day',
      suggestedGoal: 1,
      scheduleType: 'EVERY_DAY',
    },

    // Productivity (4)
    {
      cat: 'Productivity',
      name: 'Wake Up at 6 AM',
      description: 'Early morning start to own the day before notifications arrive',
      icon: 'Sunrise',
      color: '#F59E0B',
      defaultUnit: 'session',
      suggestedGoal: 1,
      scheduleType: 'SPECIFIC_DAYS',
      defaultDays: JSON.stringify(['MON', 'TUE', 'WED', 'THU', 'FRI']),
    },
    {
      cat: 'Productivity',
      name: 'Plan the Day Ahead',
      description: 'Reviewing top 3 priority tasks every morning or previous night',
      icon: 'ListTodo',
      color: '#F59E0B',
      defaultUnit: 'mins',
      suggestedGoal: 10,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Productivity',
      name: 'Deep Work Block',
      description: 'Uninterrupted pomodoro or flow state work on hardest task',
      icon: 'Focus',
      color: '#F59E0B',
      defaultUnit: 'hours',
      suggestedGoal: 2,
      scheduleType: 'SPECIFIC_DAYS',
      defaultDays: JSON.stringify(['MON', 'TUE', 'WED', 'THU', 'FRI']),
    },
    {
      cat: 'Productivity',
      name: 'Workspace Reset & Clean',
      description: 'Tidying desk surface, filing papers, and closing browser tabs',
      icon: 'Trash',
      color: '#F59E0B',
      defaultUnit: 'mins',
      suggestedGoal: 15,
      scheduleType: 'EVERY_DAY',
    },

    // Social & Life (6)
    {
      cat: 'Social & Life',
      name: 'Call Family or Friend',
      description: 'Meaningful catch-up call with parents, siblings, or dear friends',
      icon: 'PhoneCall',
      color: '#6366F1',
      defaultUnit: 'calls',
      suggestedGoal: 1,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 2,
    },
    {
      cat: 'Social & Life',
      name: 'Volunteering & Giving',
      description: 'Community service, mentorship, or mutual aid work',
      icon: 'HandHeart',
      color: '#6366F1',
      defaultUnit: 'hours',
      suggestedGoal: 1,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 1,
    },
    {
      cat: 'Social & Life',
      name: 'Daily Savings Contribution',
      description: 'Setting aside funds into investment or emergency reserve',
      icon: 'PiggyBank',
      color: '#6366F1',
      defaultUnit: 'rupees',
      suggestedGoal: 500,
      scheduleType: 'EVERY_DAY',
    },
    {
      cat: 'Social & Life',
      name: 'No-Spend Day',
      description: 'Zero non-essential consumer purchases for 24 hours',
      icon: 'CreditCard',
      color: '#6366F1',
      defaultUnit: 'day',
      suggestedGoal: 1,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 2,
    },
    {
      cat: 'Social & Life',
      name: 'Cook a New Recipe',
      description: 'Exploring international cuisines and culinary techniques',
      icon: 'ChefHat',
      color: '#6366F1',
      defaultUnit: 'recipe',
      suggestedGoal: 1,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 1,
    },
    {
      cat: 'Social & Life',
      name: 'Houseplants Care',
      description: 'Inspecting soil, misting leaves, and pruning dry stems',
      icon: 'Leaf',
      color: '#6366F1',
      defaultUnit: 'mins',
      suggestedGoal: 15,
      scheduleType: 'TIMES_PER_WEEK',
      defaultTimesPerWeek: 2,
    },
  ];

  for (const t of templateDefs) {
    const categoryId = categoryMap.get(t.cat)!;
    await prisma.hobbyTemplate.upsert({
      where: { name: t.name },
      update: {
        categoryId,
        description: t.description,
        icon: t.icon,
        color: t.color,
        defaultUnit: t.defaultUnit,
        suggestedGoal: t.suggestedGoal,
        scheduleType: t.scheduleType,
        defaultDays: t.defaultDays || null,
        defaultTimesPerWeek: t.defaultTimesPerWeek || null,
      },
      create: {
        categoryId,
        name: t.name,
        description: t.description,
        icon: t.icon,
        color: t.color,
        defaultUnit: t.defaultUnit,
        suggestedGoal: t.suggestedGoal,
        scheduleType: t.scheduleType,
        defaultDays: t.defaultDays || null,
        defaultTimesPerWeek: t.defaultTimesPerWeek || null,
      },
    });
  }
  console.log(`✔ ${templateDefs.length} Curated Hobby Templates synced across 8 categories`);

  // 3. Seed Badges (idempotent upsert)
  const badgeMap = new Map<string, string>();
  for (const b of STREAKLY_BADGES) {
    const created = await prisma.badge.upsert({
      where: { key: b.key },
      update: {
        name: b.name,
        description: b.description,
        icon: b.icon,
        tier: b.tier,
      },
      create: {
        key: b.key,
        name: b.name,
        description: b.description,
        icon: b.icon,
        tier: b.tier,
      },
    });
    badgeMap.set(b.key, created.id);
  }
  console.log(`✔ ${STREAKLY_BADGES.length} Milestones & Badges synced`);

  // 4. Create Demo User (only if not existing)
  const existingUser = await prisma.user.findUnique({
    where: { email: 'alex@streakly.dev' },
  });

  if (!existingUser) {
    const passwordHash = await bcrypt.hash('Password123!', 12);
    const demoUser = await prisma.user.create({
      data: {
        email: 'alex@streakly.dev',
        passwordHash,
        name: 'Alex Rivera',
        timezone: 'America/New_York',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      },
    });

    // 5. Create 5 Active Hobbies for Alex with 90-Day History
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

  const userHabitConfigs = [
    {
      cat: 'Learning',
      title: 'Coding Practice',
      description: 'Building modern full-stack web applications',
      icon: 'Code2',
      color: '#3B82F6',
      unit: 'mins',
      targetAmount: 45,
      scheduleType: 'EVERY_DAY',
      streak: 64,
      totalCount: 82,
      personalBest: 120,
    },
    {
      cat: 'Fitness',
      title: 'Gym Workout',
      description: 'Strength training and hypertrophy',
      icon: 'Dumbbell',
      color: '#10B981',
      unit: 'mins',
      targetAmount: 45,
      scheduleType: 'SPECIFIC_DAYS',
      scheduleDays: JSON.stringify(['MON', 'WED', 'FRI']),
      streak: 28,
      totalCount: 38,
      personalBest: 75,
    },
    {
      cat: 'Learning',
      title: 'Book Reading',
      description: 'Deep non-fiction and mental models',
      icon: 'BookOpen',
      color: '#6366F1',
      unit: 'pages',
      targetAmount: 20,
      scheduleType: 'EVERY_DAY',
      streak: 18,
      totalCount: 42,
      personalBest: 55,
    },
    {
      cat: 'Health',
      title: 'Drink 8 Glasses of Water',
      description: 'Daily hydration with lemon and mint',
      icon: 'Droplets',
      color: '#F43F5E',
      unit: 'glasses',
      targetAmount: 8,
      scheduleType: 'EVERY_DAY',
      streak: 12,
      totalCount: 22,
      personalBest: 10,
    },
    {
      cat: 'Music',
      title: 'Guitar Practice',
      description: 'Acoustic fingerpicking and chords',
      icon: 'Music',
      color: '#EC4899',
      unit: 'mins',
      targetAmount: 20,
      scheduleType: 'TIMES_PER_WEEK',
      timesPerWeek: 3,
      streak: 5,
      weeklyStreak: 5,
      totalCount: 16,
      personalBest: 40,
    },
  ];

  const sampleNotes = [
    'Great focus today! Flow state reached early.',
    'Pushed through low energy and felt refreshed afterwards.',
    'Focused on fundamentals and clean posture.',
    'Challenging session, but breakthrough on tricky parts!',
    'Consistent rhythm, done right before breakfast.',
  ];

  for (const h of userHabitConfigs) {
    const categoryId = categoryMap.get(h.cat)!;
    const habit = await prisma.habit.create({
      data: {
        userId: demoUser.id,
        categoryId,
        title: h.title,
        description: h.description,
        icon: h.icon,
        color: h.color,
        unit: h.unit,
        targetAmount: h.targetAmount,
        scheduleType: h.scheduleType,
        scheduleDays: h.scheduleDays || null,
        timesPerWeek: h.timesPerWeek || 7,
        currentStreak: h.streak,
        longestStreak: Math.max(h.streak, h.streak + 8),
        weeklyStreak: h.weeklyStreak || 0,
        totalCheckIns: h.totalCount,
        personalBestAmount: h.personalBest,
      },
    });

    // Generate CheckIns over last 90 days
    for (let dayOffset = 0; dayOffset < h.totalCount; dayOffset++) {
      const checkInDate = new Date(today);
      checkInDate.setDate(today.getDate() - dayOffset);
      const dateStr = checkInDate.toISOString().split('T')[0];

      const hour = 8 + (dayOffset % 4);
      const minute = (dayOffset * 9) % 60;
      const timestamp = new Date(
        checkInDate.getFullYear(),
        checkInDate.getMonth(),
        checkInDate.getDate(),
        hour,
        minute,
        0
      );

      // Amount: mostly meets target, occasionally exceeds for personal records
      const amount =
        dayOffset === 10
          ? h.personalBest
          : Math.round((h.targetAmount + (dayOffset % 3) * 5) * 10) / 10;
      const effort = 3 + (dayOffset % 3); // 3, 4, 5 rating
      const note = dayOffset % 5 === 0 ? sampleNotes[(dayOffset / 5) % sampleNotes.length] : null;

      await prisma.checkIn.create({
        data: {
          userId: demoUser.id,
          habitId: habit.id,
          date: dateStr,
          timestamp,
          amount,
          effort,
          note,
        },
      });
    }

    // Add reminder
    await prisma.reminder.create({
      data: {
        userId: demoUser.id,
        habitId: habit.id,
        reminderTime: '08:30',
        isEnabled: true,
      },
    });
  }

  // 6. Seed Freezes (1 freeze used 3 days ago)
  const threeDaysAgoStr = new Date(today.getTime() - 3 * 86400000).toISOString().split('T')[0];
  await prisma.freeze.create({
    data: {
      userId: demoUser.id,
      date: threeDaysAgoStr,
      monthKey: threeDaysAgoStr.slice(0, 7),
      reason: 'Fever and rest day',
    },
  });

  // 7. Seed Advance Rest Day (planned in 4 days)
  const fourDaysFutureStr = new Date(today.getTime() + 4 * 86400000).toISOString().split('T')[0];
  await prisma.restDay.create({
    data: {
      userId: demoUser.id,
      date: fourDaysFutureStr,
      reason: 'Travel & Flight to Conference',
    },
  });

  // 8. Seed Goals with Deadlines
  const codingHabit = await prisma.habit.findFirst({
    where: { userId: demoUser.id, title: 'Coding Practice' },
  });
  if (codingHabit) {
    await prisma.goal.create({
      data: {
        userId: demoUser.id,
        habitId: codingHabit.id,
        title: 'Complete 50 Hours of Deep Coding',
        targetAmount: 3000, // 3000 mins = 50 hours
        unit: 'mins',
        deadline: '2026-12-31',
        currentAmount: 1950,
        isCompleted: false,
      },
    });
  }

  const readingHabit = await prisma.habit.findFirst({
    where: { userId: demoUser.id, title: 'Book Reading' },
  });
  if (readingHabit) {
    await prisma.goal.create({
      data: {
        userId: demoUser.id,
        habitId: readingHabit.id,
        title: 'Read 1,000 Pages This Quarter',
        targetAmount: 1000,
        unit: 'pages',
        deadline: '2026-11-30',
        currentAmount: 840,
        isCompleted: false,
      },
    });
  }

  // 9. Award Initial User Badges to Alex
  const badgesToAward = ['first-checkin', 'streak-7', 'perfect-week', 'personal-record', 'streak-30'];
  for (const key of badgesToAward) {
    const badgeId = badgeMap.get(key);
    if (badgeId) {
      await prisma.userBadge.create({
        data: {
          userId: demoUser.id,
          badgeId,
          earnedAt: new Date(today.getTime() - 14 * 86400000),
        },
      });
    }
  }

    console.log('⚡ Demo user Alex created with 90-day history.');
  } else {
    console.log('✔ Demo user Alex already exists (data preserved).');
  }

  console.log('⚡ Streakly seed completed successfully! All templates, categories, and badges synced.');
}

export { main as seedDatabase };

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
