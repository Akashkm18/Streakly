import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';
import crypto from 'crypto';

let authCookie: string;
let testUserEmail = `security_test_${Date.now()}@streakly.dev`;
let testUserPassword = 'OriginalPassword123!';
let testUserId: string;

beforeAll(async () => {
  // Register a dedicated test user
  const regRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      name: 'Security Test User',
      email: testUserEmail,
      password: testUserPassword,
      timezone: 'UTC',
    });

  expect(regRes.status).toBe(201);
  testUserId = regRes.body.data.user.id;

  const cookies = regRes.headers['set-cookie'];
  expect(cookies).toBeDefined();
  authCookie = cookies.find((c: string) => c.startsWith('accessToken=')) || '';
});

describe('Security API: Anti-Enumeration & Account Lockout', () => {
  it('returns generic error on non-existent email (anti-enumeration)', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'does_not_exist_at_all@streakly.dev',
        password: 'AnyPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('returns generic error on wrong password for valid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUserEmail,
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('triggers account lockout after 5 consecutive failed logins', async () => {
    // Send 4 more failed attempts (1 already sent in previous test)
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUserEmail,
          password: 'WrongPassword999!',
        });
    }

    // 5th failed attempt triggers lockout
    const fifthRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUserEmail,
        password: 'WrongPassword999!',
      });

    expect(fifthRes.status).toBe(401);
    expect(fifthRes.body.error.message).toContain('locked');

    // 6th attempt is blocked by lockout
    const sixthRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUserEmail,
        password: testUserPassword, // even with correct password
      });

    expect(sixthRes.status).toBe(401);
    expect(sixthRes.body.error.message).toContain('temporarily locked');

    // Reset lockout for further tests
    await prisma.user.update({
      where: { id: testUserId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });
});

describe('Security API: Forgot Password via Email OTP', () => {
  let activeOtpCode: string;
  let resetToken: string;

  it('POST /forgot-password returns generic message for any email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testUserEmail });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('6-digit verification code has been sent');

    // Verify OTP record created in database
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: { userId: testUserId, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });
    expect(otpRecord).toBeDefined();
    expect(otpRecord?.otpHash).toBeDefined();
    expect(otpRecord?.attempts).toBe(0);
    expect(otpRecord?.maxAttempts).toBe(5);
  });

  it('POST /verify-otp rejects invalid OTP and decrements attempts', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: testUserEmail,
        otp: '000000',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Invalid code');
  });

  it('POST /verify-otp accepts valid OTP and issues single-use reset token', async () => {
    // Generate known OTP for testing
    const testOtp = '739102';
    const testOtpHash = crypto.createHash('sha256').update(testOtp).digest('hex');

    await prisma.passwordResetOtp.updateMany({
      where: { userId: testUserId, isUsed: false },
      data: { otpHash: testOtpHash },
    });

    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: testUserEmail,
        otp: testOtp,
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('resetToken');
    resetToken = res.body.data.resetToken;
  });

  it('POST /reset-password rejects non-compliant password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        resetToken,
        newPassword: 'weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toContain('Password must be at least 8 characters');
  });

  it('POST /reset-password updates password and revokes active sessions', async () => {
    const newPassword = 'NewStrongPassword456!';
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        resetToken,
        newPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('Password has been reset successfully');

    // Verify user can log in with new password
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUserEmail,
        password: newPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.user.email).toBe(testUserEmail);

    // Old password should now fail
    const oldLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUserEmail,
        password: testUserPassword,
      });

    expect(oldLoginRes.status).toBe(401);
  });
});

describe('Security API: IDOR Protection', () => {
  it('returns 404 when querying non-existent or unowned habit ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .get(`/api/v1/habits/${fakeId}`)
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Hobby not found');
  });

  it('returns 404 when attempting to delete unowned habit', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request(app)
      .delete(`/api/v1/habits/${fakeId}`)
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Hobby not found');
  });
});

describe('Security API: JSON Data Export', () => {
  it('GET /api/v1/export/json returns full JSON archive for authenticated user', async () => {
    const res = await request(app)
      .get('/api/v1/export/json')
      .set('Cookie', [authCookie]);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('application/json');
    expect(res.body).toHaveProperty('version', '1.0');
    expect(res.body).toHaveProperty('user');
    expect(res.body).toHaveProperty('habits');
    expect(res.body).toHaveProperty('freezes');
    expect(res.body).toHaveProperty('goals');
    expect(res.body).toHaveProperty('badges');
  });
});
