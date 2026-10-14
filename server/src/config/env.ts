import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rawSmtpPass = process.env.SMTP_PASS ? process.env.SMTP_PASS.replace(/\s+/g, '') : '';
const rawMailFrom = process.env.MAIL_FROM || process.env.SMTP_FROM || 'Streakly <support@streakly.dev>';

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_SECURE: z.coerce.boolean().default(false),
  MAIL_FROM: z.string().default('Streakly <support@streakly.dev>'),
  SMTP_FROM: z.string().default('Streakly <support@streakly.dev>'),
});

const envDataToParse = {
  ...process.env,
  SMTP_PASS: rawSmtpPass,
  MAIL_FROM: rawMailFrom,
  SMTP_FROM: rawMailFrom,
  SMTP_SECURE: process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === 'true'
    : process.env.SMTP_PORT === '465',
};

const parsedEnv = envSchema.safeParse(envDataToParse);

if (!parsedEnv.success) {
  const missingOrInvalid = parsedEnv.error.issues.map(
    (issue) => `${issue.path.join('.')}: ${issue.message}`
  );
  console.error('❌ FATAL: Invalid or missing environment configuration:');
  missingOrInvalid.forEach((msg) => console.error(`  - ${msg}`));
  if (process.env.NODE_ENV === 'production') {
    const varNames = parsedEnv.error.issues.map((i) => i.path.join('.')).join(', ');
    throw new Error(`Production startup aborted: missing or invalid environment variables: ${varNames}`);
  }
}

export const env = parsedEnv.success
  ? parsedEnv.data
  : {
      PORT: parseInt(process.env.PORT || '5000', 10),
      NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
      DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
      CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'streakly_super_secret_access_jwt_key_32chars_min_length!',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'streakly_super_secret_refresh_jwt_key_32chars_min_length!',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
      SMTP_HOST: process.env.SMTP_HOST || 'localhost',
      SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
      SMTP_USER: process.env.SMTP_USER || '',
      SMTP_PASS: rawSmtpPass,
      SMTP_SECURE: false,
      MAIL_FROM: rawMailFrom,
      SMTP_FROM: rawMailFrom,
    };
