import 'dotenv/config';
import app from './app';
import { env } from './config/env';
import { connectDatabase, prisma } from './config/database';
import { getFirebaseAdmin } from './config/firebase';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    // 1. Connect to Database
    await connectDatabase();

    // 2. Initialize Firebase Admin
    getFirebaseAdmin();

    // 3. Start Express Server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 FarmLink Backend Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
      logger.info(`📡 API Base URL: http://localhost:${env.PORT}${env.API_PREFIX}`);
      logger.info(`🩺 Health check: http://localhost:${env.PORT}/health`);
    });

    // Graceful Shutdown
    const handleShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await prisma.$disconnect();
        logger.info('Database connection closed.');
        process.exit(0);
      });

      // Force shutdown after 10s if hung
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
