/**
 * middleware/error.ts
 *
 * Global Express error-handling middleware.
 *
 * Catches all errors passed to next(err) and formats them into
 * the standard API error envelope.
 *
 * Error type handling:
 *   AppError          → operational error, use its statusCode and message
 *   AppError with validationErrors → include field-level errors in response
 *   Sequelize errors  → map to appropriate HTTP codes
 *   Multer errors     → file upload failures (400 / 413)
 *   Unknown           → 500 Internal Server Error
 */

import { Request, Response, NextFunction } from 'express';
import { ValidationError as SequelizeValidationError, UniqueConstraintError } from 'sequelize';
import multer from 'multer';
import { AppError } from '@/utils/AppError';
import { sendError } from '@/utils/apiResponse';
import { logger } from '@/config/logger';
import { env } from '@/config/env';

type AppErrorWithValidation = AppError & {
  validationErrors?: Record<string, string[]>;
};

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // ── AppError (operational) ────────────────────────────────────────────────
  if (err instanceof AppError) {
    const appErr = err as AppErrorWithValidation;

    if (appErr.statusCode >= 500) {
      logger.error(`[${appErr.code}] ${appErr.message}`, {
        path: req.path,
        method: req.method,
        stack: appErr.stack,
      });
    } else {
      logger.warn(`[${appErr.code}] ${appErr.message}`, {
        path: req.path,
        method: req.method,
      });
    }

    sendError(
      res,
      appErr.message,
      appErr.statusCode,
      appErr.code,
      appErr.validationErrors,
    );
    return;
  }

  // ── Sequelize UniqueConstraintError ───────────────────────────────────────
  if (err instanceof UniqueConstraintError) {
    const field = Object.keys(err.fields ?? {})[0] ?? 'field';
    const message = `${field} already exists`;
    logger.warn(`[CONFLICT] ${message}`, { path: req.path });
    sendError(res, message, 409, 'CONFLICT');
    return;
  }

  // ── Sequelize ValidationError ─────────────────────────────────────────────
  if (err instanceof SequelizeValidationError) {
    const errors: Record<string, string[]> = {};
    err.errors.forEach((e) => {
      const key = e.path ?? 'unknown';
      if (!errors[key]) errors[key] = [];
      errors[key].push(e.message);
    });
    logger.warn('[VALIDATION] Sequelize validation failed', { errors, path: req.path });
    sendError(res, 'Validation failed', 422, 'VALIDATION_ERROR', errors);
    return;
  }

  // ── Multer errors ─────────────────────────────────────────────────────────
  if (err instanceof multer.MulterError) {
    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? `File too large. Maximum allowed size is ${env.MAX_FILE_SIZE_MB}MB`
        : `File upload error: ${err.message}`;
    logger.warn(`[MULTER] ${err.code}: ${err.message}`);
    sendError(res, message, statusCode, err.code);
    return;
  }

  // ── SyntaxError (malformed JSON body) ─────────────────────────────────────
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, 'Invalid JSON in request body', 400, 'INVALID_JSON');
    return;
  }

  // ── Unknown / programmer error ────────────────────────────────────────────
  const error = err instanceof Error ? err : new Error(String(err));
  logger.error(`[UNHANDLED] ${error.message}`, {
    path: req.path,
    method: req.method,
    stack: error.stack,
  });

  const message =
    env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : error.message;

  sendError(res, message, 500, 'INTERNAL_ERROR');
}
