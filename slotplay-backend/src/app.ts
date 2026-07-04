/**
 * app.ts
 *
 * Express application factory.
 *
 * Middleware order matters — this is the correct sequence:
 *   1. Security headers (helmet)
 *   2. CORS (must be before other middleware to handle preflight OPTIONS)
 *   3. Request logging (morgan)
 *   4. Body parsers
 *   5. Session (must be before routes so req.session is populated)
 *   6. Static files (uploads served here)
 *   7. API rate limiters
 *   8. Application routes
 *   9. 404 handler
 *  10. Global error handler (must be last, must have 4 args)
 */

import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';

import { env } from '@/config/env';
import { morganStream } from '@/config/logger';
import { buildSessionMiddleware } from '@/config/session';
import { errorMiddleware } from '@/middleware/error';
import { apiLimiter } from '@/middleware/rateLimiter';
import { sendError } from '@/utils/apiResponse';

// Route imports (stubs for now — will be filled in later phases)
import { healthRouter } from '@/routes/health';
import { authRouter } from '@/routes/auth.routes';
import { venueRouter } from '@/routes/venue.routes';
import { bookingRouter } from '@/routes/booking.routes';
import { ownerRouter } from '@/routes/owner.routes';
import { adminRouter } from '@/routes/admin.routes';
import { notificationRouter } from '@/routes/notification.routes';
import { imageRouter } from '@/routes/image.routes';

export function createApp(): express.Application {
  const app = express();

  // ── 1. Security headers ─────────────────────────────────────────────────
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow image serving
    }),
  );

  // ── 2. CORS ─────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true, // required for session cookies
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Accept'],
    }),
  );

  // ── 3. HTTP request logging ──────────────────────────────────────────────
  const morganFormat = env.NODE_ENV === 'production' ? 'combined' : 'dev';
  app.use(morgan(morganFormat, { stream: morganStream }));

  // ── 4. Body parsers ──────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // ── 5. Session middleware ─────────────────────────────────────────────────
  app.use(buildSessionMiddleware());

  // ── 6. Static files (local uploads) ──────────────────────────────────────
  // Served at /uploads/... — only active when STORAGE_PROVIDER=local
  // In production with Cloudinary, this middleware still loads but is never hit
  app.use(
    '/uploads',
    express.static(path.resolve(process.cwd(), env.UPLOAD_DIR), {
      maxAge: '7d',
      etag: true,
    }),
  );

  // ── 7. Rate limiting ──────────────────────────────────────────────────────
  app.use('/api', apiLimiter);

  // ── 8. Application routes ─────────────────────────────────────────────────
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/venues', venueRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/owner', ownerRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/venues/:venueId/images', imageRouter);
  // ── 9. 404 handler ───────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    sendError(res, 'Route not found', 404, 'NOT_FOUND');
  });

  // ── 10. Global error handler ──────────────────────────────────────────────
  // Must be last and must have exactly 4 parameters
  app.use(
    (err: unknown, req: Request, res: Response, next: NextFunction) => {
      errorMiddleware(err, req, res, next);
    },
  );

  return app;
}
