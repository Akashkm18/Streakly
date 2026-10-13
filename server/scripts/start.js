const { execSync } = require('child_process');
const path = require('path');

console.log('⚡ [Streakly] Bootstrapping production backend on Render...');

try {
  console.log('📦 [Streakly] Pushing Prisma schema to PostgreSQL database...');
  execSync('npx prisma db push --accept-data-loss', {
    stdio: 'inherit',
    timeout: 30000,
    cwd: path.resolve(__dirname, '..'),
  });
  console.log('✔ [Streakly] Database schema synchronized.');
} catch (err) {
  console.warn('⚠️ [Streakly] Schema sync warning (proceeding):', err.message);
}

try {
  console.log('🌱 [Streakly] Seeding initial categories and hobby templates...');
  execSync('npx tsx prisma/seed.ts', {
    stdio: 'inherit',
    timeout: 30000,
    cwd: path.resolve(__dirname, '..'),
  });
  console.log('✔ [Streakly] Seeding completed.');
} catch (err) {
  console.warn('⚠️ [Streakly] Seed warning (proceeding):', err.message);
}

console.log('🚀 [Streakly] Starting Express server...');
require('../dist/server.js');
