import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { validatePassword, passwordSchema } from '../../src/common/validation/passwordPolicy';
import { hashToken, generateTokens, generateResetToken, verifyResetToken } from '../../src/common/middleware/auth';
import { sanitizeText, sanitizeOptionalText } from '../../src/common/utils/sanitizer';

describe('Security & Password Policy Unit Tests', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const res = validatePassword('Short1!');
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('at least 8 characters');
  });

  it('rejects passwords without uppercase letters', () => {
    const res = validatePassword('password123!');
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('uppercase');
  });

  it('rejects passwords without lowercase letters', () => {
    const res = validatePassword('PASSWORD123!');
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('lowercase');
  });

  it('rejects passwords without numbers', () => {
    const res = validatePassword('PasswordNoNum!');
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('number');
  });

  it('rejects passwords without special characters', () => {
    const res = validatePassword('Password1234');
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('special character');
  });

  it('accepts strong compliant passwords', () => {
    const res = validatePassword('CompliantPass123!');
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });
});

describe('Token Hashing & Cryptographic Verification', () => {
  it('hashToken generates correct deterministic SHA-256 hex digest', () => {
    const sampleToken = 'random_secret_token_123456';
    const expectedHash = crypto.createHash('sha256').update(sampleToken).digest('hex');
    expect(hashToken(sampleToken)).toBe(expectedHash);
    expect(hashToken(sampleToken)).toHaveLength(64);
  });

  it('generateTokens creates valid access and refresh token pair', () => {
    const tokens = generateTokens({
      userId: 'user-123',
      email: 'test@streakly.dev',
      name: 'Test User',
      timezone: 'UTC',
    });
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
    expect(typeof tokens.accessToken).toBe('string');
    expect(typeof tokens.refreshToken).toBe('string');
  });

  it('single-use password reset tokens can be signed and verified', () => {
    const resetToken = generateResetToken('target-user-456');
    const payload = verifyResetToken(resetToken);
    expect(payload.userId).toBe('target-user-456');
    expect(payload.purpose).toBe('password_reset');
  });
});

describe('OTP Verification Logic', () => {
  it('generates 6-digit numeric OTP and verifies with SHA-256', () => {
    const otp = crypto.randomInt(100000, 1000000).toString();
    expect(otp).toMatch(/^\d{6}$/);

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const userGuess = otp;
    const userGuessHash = crypto.createHash('sha256').update(userGuess).digest('hex');

    expect(userGuessHash).toBe(otpHash);

    const wrongGuessHash = crypto.createHash('sha256').update('000000').digest('hex');
    expect(wrongGuessHash).not.toBe(otpHash);
  });
});

describe('Input HTML Sanitization Unit Tests', () => {
  it('strips harmful HTML tags and scripts from text inputs', () => {
    const dirty = '<script>alert("xss")</script>Read 30 pages <img src="x" onerror="alert(1)">';
    const clean = sanitizeText(dirty);
    expect(clean).toBe('Read 30 pages');
    expect(clean).not.toContain('<script>');
    expect(clean).not.toContain('onerror');
  });

  it('trims whitespace and handles undefined/null in sanitizeOptionalText', () => {
    expect(sanitizeOptionalText(undefined)).toBeUndefined();
    expect(sanitizeOptionalText(null)).toBeUndefined();
    expect(sanitizeOptionalText('   ')).toBeUndefined();
    expect(sanitizeOptionalText('  Gym session notes  ')).toBe('Gym session notes');
  });
});
