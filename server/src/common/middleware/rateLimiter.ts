import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // generous for dev/tests
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      message: 'Too many authentication attempts. Please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

export const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    data: null,
    error: {
      message: 'AI coach requests limit reached. Please wait a few moments.',
      code: 'AI_RATE_LIMIT',
    },
  },
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimiter = authLimiter;
export const apiRateLimiter = apiLimiter;
