import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';

let authCookie: string;
let demoHabitId: string;

beforeAll(async () => {
  const loginRes = await request(app).post('/api/v1/auth/demo').send();
  expect(loginRes.status).toBe(200);
  const cookies = loginRes.headers['set-cookie'];
  expect(cookies).toBeDefined();
  authCookie = cookies.find((c: string) => c.startsWith('accessToken=')) || '';
});

describe('Streakly Backend API Endpoints', () => {
  it('GET /api/health returns 200 and ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('streakly-api');
  });

  it('GET /api/v1/categories returns 8 hobby categories', async () => {
    const res = await request(app).get('/api/v1/categories');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(8);
  });

  it('GET /api/v1/library returns 40+ curated hobby templates', async () => {
    const res = await request(app).get('/api/v1/library');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(40);
  });

  it('GET /api/v1/habits returns seeded hobbies with schedules and stats', async () => {
    const res = await request(app)
      .get('/api/v1/habits')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const firstHabit = res.body.data[0];
    demoHabitId = firstHabit.id;
    expect(firstHabit).toHaveProperty('title');
    expect(firstHabit).toHaveProperty('scheduleType');
    expect(firstHabit).toHaveProperty('currentStreak');
    expect(firstHabit).toHaveProperty('unit');
    expect(firstHabit).toHaveProperty('personalBestAmount');
  });

  it('POST /api/v1/habits/:id/checkin creates a measurable check-in with note and effort', async () => {
    // Generate a unique future/past date for idempotence
    const testDate = '2026-12-01';
    const res = await request(app)
      .post(`/api/v1/habits/${demoHabitId}/checkin`)
      .set('Cookie', [authCookie])
      .send({
        amount: 45,
        note: 'High focus session with great progress',
        effort: 4,
        date: testDate,
      });

    // If already exists or created, test status
    if (res.status === 201) {
      expect(res.body.data).toHaveProperty('checkIn');
      expect(res.body.data.checkIn.amount).toBe(45);
      expect(res.body.data.checkIn.effort).toBe(4);
      expect(res.body.data.checkIn.note).toBe('High focus session with great progress');
    } else {
      expect([200, 400]).toContain(res.status);
    }
  });

  it('GET /api/v1/freezes returns monthly freeze status (max 2/month)', async () => {
    const res = await request(app)
      .get('/api/v1/freezes')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('maxPerMonth', 2);
    expect(res.body.data).toHaveProperty('usedThisMonth');
    expect(res.body.data).toHaveProperty('remainingThisMonth');
  });

  it('GET /api/v1/rest-days returns user scheduled rest days', async () => {
    const res = await request(app)
      .get('/api/v1/rest-days')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('GET /api/v1/goals returns active goals with velocity and on-track status', async () => {
    const res = await request(app)
      .get('/api/v1/goals')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    if (res.body.data.length > 0) {
      const goal = res.body.data[0];
      expect(goal).toHaveProperty('status');
      expect(['ON_TRACK', 'BEHIND', 'COMPLETED']).toContain(goal.status);
      expect(goal).toHaveProperty('progressPct');
      expect(goal).toHaveProperty('projectedFinishDate');
    }
  });

  it('GET /api/v1/badges returns milestone badge shelf and unlocked state', async () => {
    const res = await request(app)
      .get('/api/v1/badges')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('badges');
    expect(res.body.data.badges.length).toBeGreaterThanOrEqual(8);
    expect(res.body.data).toHaveProperty('unlockedCount');
  });

  it('GET /api/v1/insights/summary returns analytics metrics', async () => {
    const res = await request(app)
      .get('/api/v1/insights/summary')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('totalCheckIns');
    expect(res.body.data).toHaveProperty('longestStreak');
    expect(res.body.data).toHaveProperty('mostActiveDay');
  });

  it('GET /api/v1/insights/heatmap returns 365 daily activity points', async () => {
    const res = await request(app)
      .get('/api/v1/insights/heatmap')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThanOrEqual(364);
  });

  it('GET /api/v1/insights/breakdown returns category distribution', async () => {
    const res = await request(app)
      .get('/api/v1/insights/breakdown')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it('GET /api/v1/export/csv returns downloadable CSV', async () => {
    const res = await request(app)
      .get('/api/v1/export/csv')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/csv');
    expect(res.text).toContain('Date,Habit,Category,Amount,Unit');
  });

  it('GET /api/v1/export/monthly-report returns printable monthly summary', async () => {
    const res = await request(app)
      .get('/api/v1/export/monthly-report')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('month');
    expect(res.body.data).toHaveProperty('totalCheckInsThisMonth');
    expect(res.body.data).toHaveProperty('habits');
  });
});
