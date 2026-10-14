import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { env } from '../../config/env';
import { ForbiddenError } from '../errors/AppError';

export const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
  'http://localhost:10000',
  'http://127.0.0.1:10000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  process.env.RENDER_EXTERNAL_URL,
  env.CLIENT_URL,
].filter(Boolean);

export const isOriginAllowed = (origin: string): boolean => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.hostname.endsWith('.onrender.com')) return true;
  } catch {
    // ignore
  }
  return false;
};

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: [
        "'self'",
        'wss:',
        'ws:',
        'https:',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:10000',
        'http://127.0.0.1:10000',
        env.CLIENT_URL,
      ].filter(Boolean),
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
});

export function csrfOriginCheck(req: Request, _res: Response, next: NextFunction): void {
  // Safe read methods bypass check
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;

  // If origin is provided, verify it
  if (origin) {
    if (!isOriginAllowed(origin)) {
      return next(new ForbiddenError('Cross-site request blocked: Origin not allowed'));
    }
    return next();
  }

  // If referer is provided, verify host
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      if (!isOriginAllowed(refererOrigin)) {
        return next(new ForbiddenError('Cross-site request blocked: Referer not allowed'));
      }
      return next();
    } catch {
      return next(new ForbiddenError('Invalid referer header'));
    }
  }

  // If neither origin nor referer is provided (e.g. mobile app, curl, server-to-server), allow
  next();
}
