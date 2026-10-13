import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Streakly Habit & Hobby Tracker API',
      version: '1.0.0',
      description:
        'Full-stack REST API for Streakly — a clean, professional habit and hobby streak tracker. Features: 40+ Curated Hobby Library, Flexible Schedules (Mon/Wed/Fri, Weekly), Measurable Progress & Personal Bests, Rest Days & Freezes, Goals with Velocity Projections, Badges Shelf, and 365-day Insights.',
    },
    servers: [
      {
        url: 'http://localhost:5000/api/v1',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
