import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { initializeSockets } from './sockets/socketManager';
import { initializeScheduledJobs } from './jobs/cron';

const server = http.createServer(app);

// Initialize real-time Socket.IO gateway
initializeSockets(server);

// Initialize scheduled background jobs
initializeScheduledJobs();

server.listen(env.PORT, () => {
  console.log(`🌿 Bloom API Server flourishing on http://localhost:${env.PORT}`);
  console.log(`📖 Swagger API Documentation available at http://localhost:${env.PORT}/api/docs`);
});
