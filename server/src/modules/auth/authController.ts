import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../prisma';
import {
  createRefreshTokenSession,
  hashToken,
  setAuthCookies,
  clearAuthCookies,
  generateResetToken,
  verifyResetToken,
} from '../../common/middleware/auth';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../../common/errors/AppError';
import { validatePassword } from '../../common/validation/passwordPolicy';
import { sanitizeText } from '../../common/utils/sanitizer';
import { sendOtpEmail, sendPasswordResetSuccessEmail } from './emailService';
import { logAuditEvent } from '../../common/services/auditService';

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, name, timezone = 'UTC' } = req.body;
    if (!email || !password || !name) {
      throw new BadRequestError('Email, password, and name are required');
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = sanitizeText(name);

    if (!cleanName) {
      throw new BadRequestError('A valid display name is required');
    }

    // Enforce password policy
    const policyResult = validatePassword(password);
    if (!policyResult.isValid) {
      throw new BadRequestError(policyResult.errors[0]);
    }

    const existing = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      throw new BadRequestError('An account with this email already exists');
    }

    // Bcrypt cost 12
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: cleanName,
        timezone,
      },
      select: { id: true, email: true, name: true, timezone: true, avatarUrl: true },
    });

    const tokens = await createRefreshTokenSession(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    await logAuditEvent({
      userId: user.id,
      event: 'USER_REGISTERED',
      req,
      metadata: { email: cleanEmail },
    });

    res.status(201).json({
      data: { user, ...tokens },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    // Anti-enumeration: Constant time check & generic error
    if (!user) {
      // Fake compare to mitigate timing attacks
      await bcrypt.compare(password, '$2a$12$e8p21J7vY4eYqI7tXh8iLe7Oeql2zW.QvjL4pZp7aMvV.vA/1e582');
      await logAuditEvent({
        event: 'LOGIN_FAILED',
        req,
        metadata: { email: cleanEmail, reason: 'user_not_found' },
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMs = user.lockedUntil.getTime() - Date.now();
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / (60 * 1000)));

      await logAuditEvent({
        userId: user.id,
        event: 'LOGIN_BLOCKED_LOCKOUT',
        req,
      });

      throw new UnauthorizedError(
        `Account is temporarily locked due to too many failed attempts. Try again in ${remainingMinutes} minute${
          remainingMinutes > 1 ? 's' : ''
        }.`
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      const newAttempts = user.failedLoginAttempts + 1;
      const isLockout = newAttempts >= 5;
      const lockedUntil = isLockout ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newAttempts,
          lockedUntil,
        },
      });

      await logAuditEvent({
        userId: user.id,
        event: isLockout ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED',
        req,
        metadata: { attempts: newAttempts },
      });

      if (isLockout) {
        throw new UnauthorizedError(
          'Account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts.'
        );
      }

      throw new UnauthorizedError('Invalid email or password');
    }

    // Reset failed login attempts on success
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    const tokens = await createRefreshTokenSession(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    await logAuditEvent({
      userId: user.id,
      event: 'LOGIN_SUCCESS',
      req,
    });

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
          avatarUrl: user.avatarUrl,
        },
        ...tokens,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function demoLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { email: 'alex@streakly.dev' } });
    if (!user) {
      throw new UnauthorizedError('Demo user not found. Please run seed script.');
    }

    const tokens = await createRefreshTokenSession(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    await logAuditEvent({
      userId: user.id,
      event: 'DEMO_LOGIN',
      req,
    });

    res.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          timezone: user.timezone,
          avatarUrl: user.avatarUrl,
        },
        ...tokens,
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token required');
    }

    const tokenHash = hashToken(refreshToken);
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    // Reuse detection
    if (!tokenRecord || tokenRecord.isRevoked) {
      if (tokenRecord) {
        // Token was already revoked -> Revoke entire family!
        await prisma.refreshToken.updateMany({
          where: { familyId: tokenRecord.familyId },
          data: { isRevoked: true },
        });

        await logAuditEvent({
          userId: tokenRecord.userId,
          event: 'TOKEN_REUSE_DETECTED',
          req,
          metadata: { familyId: tokenRecord.familyId },
        });
      }

      clearAuthCookies(res);
      throw new UnauthorizedError('Invalid or expired refresh token. Please sign in again.');
    }

    // Expiry check
    if (tokenRecord.expiresAt < new Date()) {
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { isRevoked: true },
      });
      clearAuthCookies(res);
      throw new UnauthorizedError('Refresh token has expired. Please sign in again.');
    }

    // Invalidate current token and rotate to new one within same family
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    const newTokens = await createRefreshTokenSession(tokenRecord.user, tokenRecord.familyId);
    setAuthCookies(res, newTokens.accessToken, newTokens.refreshToken);

    res.json({
      data: newTokens,
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { isRevoked: true },
      });
    }

    if (req.user?.userId) {
      await logAuditEvent({
        userId: req.user.userId,
        event: 'LOGOUT',
        req,
      });
    }

    clearAuthCookies(res);
    res.json({ data: { message: 'Logged out successfully' }, error: null });
  } catch {
    clearAuthCookies(res);
    res.json({ data: { message: 'Logged out successfully' }, error: null });
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        timezone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    res.json({ data: { user }, error: null });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string') {
      throw new BadRequestError('Email is required');
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });

    if (user) {
      // 6-digit cryptographic OTP
      const otp = crypto.randomInt(100000, 1000000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

      // Invalidate previous active OTPs for this user
      await prisma.passwordResetOtp.updateMany({
        where: { userId: user.id, isUsed: false },
        data: { isUsed: true },
      });

      // Save new OTP with 10m expiry and max 5 attempts
      await prisma.passwordResetOtp.create({
        data: {
          userId: user.id,
          otpHash,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
          maxAttempts: 5,
        },
      });

      await logAuditEvent({
        userId: user.id,
        event: 'PASSWORD_RESET_REQUESTED',
        req,
      });

      // Send email (asynchronous, won't block or reveal failure)
      sendOtpEmail(user.email, otp).catch((err) =>
        console.error('[ForgotPassword] Failed to send email:', err)
      );
    }

    // Anti-enumeration generic response
    res.json({
      data: {
        message: 'If an account exists with this email, a 6-digit verification code has been sent.',
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new BadRequestError('Email and verification code are required');
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: cleanEmail } });
    if (!user) {
      throw new BadRequestError('Invalid or expired verification code');
    }

    const activeOtp = await prisma.passwordResetOtp.findFirst({
      where: { userId: user.id, isUsed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!activeOtp || activeOtp.expiresAt < new Date()) {
      throw new BadRequestError('Verification code has expired. Please request a new one.');
    }

    if (activeOtp.attempts >= activeOtp.maxAttempts) {
      throw new BadRequestError('Too many failed attempts. Please request a new code.');
    }

    const inputHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

    if (inputHash !== activeOtp.otpHash) {
      const newAttempts = activeOtp.attempts + 1;
      await prisma.passwordResetOtp.update({
        where: { id: activeOtp.id },
        data: { attempts: newAttempts },
      });

      const remaining = activeOtp.maxAttempts - newAttempts;
      if (remaining <= 0) {
        throw new BadRequestError('Too many failed attempts. Please request a new code.');
      }
      throw new BadRequestError(`Invalid code. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining.`);
    }

    // OTP is valid! Generate single-use reset token
    const resetToken = generateResetToken(user.id);
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.passwordResetOtp.update({
      where: { id: activeOtp.id },
      data: {
        isUsed: true,
        resetTokenHash,
        resetTokenExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await logAuditEvent({
      userId: user.id,
      event: 'OTP_VERIFIED',
      req,
    });

    res.json({
      data: {
        resetToken,
        message: 'Code verified successfully',
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      throw new BadRequestError('Reset token and new password are required');
    }

    const payload = verifyResetToken(resetToken);
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        userId: payload.userId,
        resetTokenHash,
      },
    });

    if (!otpRecord || !otpRecord.resetTokenExpiresAt || otpRecord.resetTokenExpiresAt < new Date()) {
      throw new BadRequestError('Password reset link is invalid or has expired. Please request a new code.');
    }

    // Validate new password complexity
    const policyResult = validatePassword(newPassword);
    if (!policyResult.isValid) {
      throw new BadRequestError(policyResult.errors[0]);
    }

    const newHash = await bcrypt.hash(newPassword, 12);

    // Invalidate reset token, update user password, and revoke all active refresh tokens
    await prisma.$transaction([
      prisma.user.update({
        where: { id: payload.userId },
        data: {
          passwordHash: newHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.passwordResetOtp.update({
        where: { id: otpRecord.id },
        data: { resetTokenHash: null },
      }),
      prisma.refreshToken.updateMany({
        where: { userId: payload.userId, isRevoked: false },
        data: { isRevoked: true },
      }),
    ]);

    await logAuditEvent({
      userId: payload.userId,
      event: 'PASSWORD_RESET_SUCCESS',
      req,
    });

    // Send confirmation email
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (user) {
      sendPasswordResetSuccessEmail(user.email).catch((err) =>
        console.error('[ResetPassword] Failed to send notice:', err)
      );
    }

    clearAuthCookies(res);

    res.json({
      data: {
        message: 'Password has been reset successfully. Please log in with your new password.',
      },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.userId;
    const { password } = req.body;

    if (!password) {
      throw new BadRequestError('Password confirmation is required to delete your account');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Incorrect password. Account deletion aborted.');
    }

    // Cascade delete user and all associated habits, check-ins, freezes, goals, badges, reminders
    await prisma.user.delete({ where: { id: userId } });

    await logAuditEvent({
      userId,
      event: 'ACCOUNT_DELETED',
      req,
    });

    clearAuthCookies(res);

    res.json({
      data: { message: 'Account and all associated data have been permanently deleted.' },
      error: null,
    });
  } catch (err) {
    next(err);
  }
}
