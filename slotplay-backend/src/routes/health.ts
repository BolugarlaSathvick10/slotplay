/**
 * routes/health.ts
 *
 * Health check endpoint used by Railway and monitoring services.
 * Returns 200 when the server is up and the database is reachable.
 */

import { Router, Request, Response } from 'express';
import { sequelize } from '@/config/database';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { logger } from '@/config/logger';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  try {
    // Lightweight DB ping
    await sequelize.authenticate();

    sendSuccess(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected',
    });
  } catch (error) {
    logger.error('Health check failed — DB unreachable', {
      error: error instanceof Error ? error.message : String(error),
    });

    sendError(
      res,
      'Service unavailable — database connection failed',
      503,
      'DB_UNAVAILABLE',
    );
  }
});
