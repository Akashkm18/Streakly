import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { initializeSockets } from './sockets/socketManager';
import { initializeScheduledJobs } from './jobs/cron';
import { seedHobbyTemplates } from './common/utils/autoSeed';

const server = http.createServer(app);

// Initialize real-time Socket.IO gateway
initializeSockets(server);

// Initialize scheduled background jobs
initializeScheduledJobs();

server.listen(env.PORT, '0.0.0.0', () => {
  console.log(`⚡ Streakly Server online on port ${env.PORT} (0.0.0.0)`);
  console.log(`📖 Swagger API Documentation available at http://localhost:${env.PORT}/api/docs`);

  // Asynchronously synchronize hobby categories & templates in background (non-blocking)
  seedHobbyTemplates().catch((err: any) => {
    console.warn('⚠️ [Streakly] Background template seed notice:', err?.message || err);
  });
});

