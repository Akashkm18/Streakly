import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { UnauthorizedError } from '../errors/AppError';
import { prisma } from '../../prisma';

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  timezone: string;
}

export interface ResetTokenPayload {
  userId: string;
  purpose: 'password_reset';
}

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateTokens(payload: TokenPayload) {
  const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
  });
  const refreshToken = jwt.sign(
    { ...payload, nonce: crypto.randomBytes(16).toString('hex') },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: '7d',
    }
  );
  return { accessToken, refreshToken };
}

export async function createRefreshTokenSession(
  user: { id: string; email: string; name: string; timezone: string },
  existingFamilyId?: string
) {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    timezone: user.timezone,
  };

  const { accessToken, refreshToken } = generateTokens(payload);
  const familyId = existingFamilyId || crypto.randomUUID();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash,
      familyId,
      expiresAt,
    },
  });

  return { accessToken, refreshToken, familyId };
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired access token', 'TOKEN_EXPIRED');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token', 'REFRESH_EXPIRED');
  }
}

export function generateResetToken(userId: string): string {
  return jwt.sign({ userId, purpose: 'password_reset' }, env.JWT_ACCESS_SECRET, {
    expiresIn: '10m',
  });
}

export function verifyResetToken(token: string): ResetTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as ResetTokenPayload;
    if (payload.purpose !== 'password_reset') {
      throw new UnauthorizedError('Invalid reset token purpose');
    }
    return payload;
  } catch {
    throw new UnauthorizedError('Invalid or expired password reset token', 'RESET_TOKEN_INVALID');
  }
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken?: string) {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
    path: '/',
  });

  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    let token = req.cookies?.accessToken;

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token missing', 'TOKEN_MISSING');
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
}
