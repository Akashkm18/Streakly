const { execSync } = require('child_process');

console.log('🔄 [Streakly] Running database migrations...');
try {
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('✔ [Streakly] Database migrations deployed.');
} catch (deployErr) {
  console.log('⚠️ [Streakly] prisma migrate deploy failed; checking if baseline resolution is required (P3005)...');
  try {
    execSync('npx prisma migrate resolve --applied 20261014000000_init', { stdio: 'inherit' });
    console.log('✔ [Streakly] Baseline migration 20261014000000_init marked as applied.');
  } catch (resolveErr) {
    console.error('❌ [Streakly] Failed to apply or baseline migrations:', resolveErr.message);
    process.exit(1);
  }
}
