/**
 * server.ts
 *
 * Application entry point.
 *
 * Responsibilities:
 *   1. Load environment variables
 *   2. Configure Cloudinary (no-op in v1 with local storage)
 *   3. Connect to Neon PostgreSQL
 *   4. Import all models (registers associations)
 *   5. Start Express server
 *   6. Handle graceful shutdown on SIGTERM / SIGINT
 */

// Load .env before anything else (ts-node-dev runs from project root)
import 'dotenv/config';

import { env } from './config/env';import { logger } from './config/logger';
import { connectDatabase, syncDatabase } from './config/database';
import { configureCloudinary } from './config/cloudinary';
import { createApp } from './app';

// Importing models registers all Sequelize associations defined in models/index.ts
import './models/index';
import { Role, Sport } from './models';
import { UserRole } from './types';

async function ensureDevBrowseData(): Promise<void> {
  // Only ensure roles and sports exist on startup — full venue/slot data comes from npm run seed
  await Role.findOrCreate({ where: { name: UserRole.USER  }, defaults: { name: UserRole.USER  } });
  await Role.findOrCreate({ where: { name: UserRole.OWNER }, defaults: { name: UserRole.OWNER } });
  await Role.findOrCreate({ where: { name: UserRole.ADMIN }, defaults: { name: UserRole.ADMIN } });

  await Sport.findOrCreate({ where: { name: 'Cricket'  }, defaults: { name: 'Cricket'  } });
  await Sport.findOrCreate({ where: { name: 'Football' }, defaults: { name: 'Football' } });
  await Sport.findOrCreate({ where: { name: 'Badminton'}, defaults: { name: 'Badminton'} });
}

async function bootstrap(): Promise<void> {
  try {
    // Configure external services
    configureCloudinary();

    // Establish database connection
    await connectDatabase();

    if (env.NODE_ENV === 'development') {
      // alter mode — adds missing columns without dropping existing data
      // Never use force:true here as it wipes all tables (and seeded passwords) on every restart
      await syncDatabase(false);
      await ensureDevBrowseData();
    }

    // Build Express application
    const app = createApp();

    // Start HTTP server
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀  SlotPlay API running on http://localhost:${env.PORT}`);
      logger.info(`    Environment : ${env.NODE_ENV}`);
      logger.info(`    Storage     : ${env.STORAGE_PROVIDER}`);
      logger.info(`    Payment     : ${env.PAYMENT_PROVIDER}`);
      logger.info(`    Frontend    : ${env.FRONTEND_URL}`);
    });

    // ── Graceful shutdown ───────────────────────────────────────────────────
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received — shutting down gracefully`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          const { sequelize } = await import('./config/database');
          await sequelize.close();
          logger.info('Database connection closed');
        } catch (err) {
          logger.error('Error closing database', { error: (err as Error).message });
        }

        process.exit(0);
      });

      // Force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — forcing exit');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // ── Unhandled rejections / exceptions ───────────────────────────────────
    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled promise rejection', {
        reason: reason instanceof Error ? reason.message : String(reason),
      });
    });

    process.on('uncaughtException', (err: Error) => {
      logger.error('Uncaught exception', { error: err.message, stack: err.stack });
      // Uncaught exceptions leave the process in an undefined state — exit
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  }
}

bootstrap();
