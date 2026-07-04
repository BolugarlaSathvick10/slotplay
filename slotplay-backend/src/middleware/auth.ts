/**
 * middleware/auth.ts
 *
 * Session-based authentication middleware.
 *
 * These middleware functions are STRUCTURAL STUBS in Phase 1.
 * The session check logic is complete and usable once Phase 2
 * populates req.session.userId on login.
 *
 * Usage in routes:
 *   router.get('/bookings', requireAuth, bookingController.list);
 *   router.post('/admin/venues/approve', requireAuth, requireRole('admin'), ...);
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError';
import { UserRole } from '@/types';

// ── requireAuth ───────────────────────────────────────────────────────────────

/**
 * Middleware: verifies the user has an active session.
 * Attaches nothing extra — downstream handlers read req.session directly.
 */
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.session?.userId) {
    next(AppError.unauthorised('Please log in to continue'));
    return;
  }
  next();
}

// ── requireRole ───────────────────────────────────────────────────────────────

/**
 * Middleware factory: restricts access to users with one of the given roles.
 * Must be used AFTER requireAuth.
 *
 * Usage:
 *   router.delete('/admin/users/:id', requireAuth, requireRole('admin'), ...)
 *   router.post('/venues', requireAuth, requireRole('owner', 'admin'), ...)
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.session?.role || !roles.includes(req.session.role as UserRole)) {
      next(AppError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}

// ── optionalAuth ──────────────────────────────────────────────────────────────

/**
 * Middleware: attaches session user to req if logged in, but never blocks.
 * Used on public routes that behave differently for authenticated users
 * (e.g. showing "Your booking" context on a venue page).
 */
export function optionalAuth(
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // Session is already loaded by express-session middleware.
  // No action needed — handlers check req.session.userId themselves.
  next();
}
