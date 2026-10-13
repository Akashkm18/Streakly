import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './common/middleware/errorHandler';
import { apiLimiter } from './common/middleware/rateLimiter';
import { helmetMiddleware, csrfOriginCheck, isOriginAllowed } from './common/middleware/security';
import { swaggerSpec } from './docs/swagger';

// Streakly Module routers
import authRoutes from './modules/auth/authRoutes';
import libraryRoutes from './modules/library/libraryRoutes';
import habitRoutes from './modules/habits/habitRoutes';
import checkinRoutes from './modules/checkins/checkinRoutes';
import freezeRoutes from './modules/freezes/freezeRoutes';
import restDayRoutes from './modules/restDays/restDayRoutes';
import goalRoutes from './modules/goals/goalRoutes';
import badgeRoutes from './modules/badges/badgeRoutes';
import insightRoutes from './modules/insights/insightRoutes';
import reminderRoutes from './modules/reminders/reminderRoutes';
import exportRoutes from './modules/export/exportRoutes';

export const app = express();

// Security headers with strict CSP
app.use(helmetMiddleware);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Allow during transition/cross-service
    },
    credentials: true,
  })
);

// CSRF Origin verification for mutating requests
app.use(csrfOriginCheck);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Serve uploaded photos if needed
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Rate limit API routes
app.use('/api', apiLimiter);

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'streakly-api',
    timestamp: new Date().toISOString(),
  });
});

// Streakly API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1', libraryRoutes); // /categories, /library, /library/adopt/:id
app.use('/api/v1/habits', habitRoutes);
app.use('/api/v1/habits', checkinRoutes); // /:id/checkin, /:id/checkin/:date
app.use('/api/v1/freezes', freezeRoutes);
app.use('/api/v1/rest-days', restDayRoutes);
app.use('/api/v1/goals', goalRoutes);
app.use('/api/v1/badges', badgeRoutes);
app.use('/api/v1/insights', insightRoutes);
app.use('/api/v1/reminders', reminderRoutes);
app.use('/api/v1/export', exportRoutes);

// Central error handler
app.use(errorHandler);
