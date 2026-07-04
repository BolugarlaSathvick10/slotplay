/**
 * utils/helpers.ts
 *
 * General-purpose utility functions used across the backend.
 * Keep this file pure (no side-effects, no imports from application modules).
 */

import crypto from 'crypto';
import { PaginationParams, PaginatedResult } from '@/types';

// ── OTP ───────────────────────────────────────────────────────────────────────

/**
 * Generate a cryptographically secure numeric OTP.
 * Uses crypto.randomInt to avoid modulo bias.
 */
export function generateOtp(digits = 6): string {
  const max = 10 ** digits;
  const otp = crypto.randomInt(0, max);
  return otp.toString().padStart(digits, '0');
}

/** Return the Date when an OTP expires (default: 10 minutes from now) */
export function otpExpiresAt(minutesFromNow = 10): Date {
  return new Date(Date.now() + minutesFromNow * 60 * 1000);
}

// ── Booking reference ─────────────────────────────────────────────────────────

/**
 * Generate a human-readable booking reference.
 * Format: SP-YYYYMMDD-XXXX  (e.g. SP-20240601-A4F9)
 */
export function generateBookingRef(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `SP-${date}-${suffix}`;
}

// ── Pagination ────────────────────────────────────────────────────────────────

/** Parse and clamp page / limit query params to safe values */
export function parsePagination(
  page?: unknown,
  limit?: unknown,
  maxLimit = 50,
): PaginationParams {
  const p = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
  const l = Math.min(maxLimit, Math.max(1, parseInt(String(limit ?? '20'), 10) || 20));
  return { page: p, limit: l };
}

/** Wrap a data array and count into a PaginatedResult */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResult<T> {
  return {
    data,
    total,
    page: params.page,
    limit: params.limit,
    totalPages: Math.ceil(total / params.limit),
  };
}

/** Calculate Sequelize offset from page + limit */
export function paginationOffset(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

// ── String ────────────────────────────────────────────────────────────────────

/** Safely sanitise a filename: strip path traversal, replace spaces */
export function sanitiseFilename(name: string): string {
  return name
    .replace(/[/\\?%*:|"<>]/g, '-') // remove unsafe chars
    .replace(/\s+/g, '_')           // spaces → underscores
    .replace(/\.{2,}/g, '.')        // collapse multiple dots
    .slice(0, 100);                 // limit length
}

// ── Date ──────────────────────────────────────────────────────────────────────

/** Format a Date to ISO date string YYYY-MM-DD in local time */
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Add N days to a date (returns a new Date) */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ── Async ─────────────────────────────────────────────────────────────────────

/**
 * Wraps an async Express handler so unhandled promise rejections are
 * automatically passed to next(err). Eliminates try/catch boilerplate
 * in every controller.
 *
 * Usage:
 *   router.get('/venues', asyncHandler(venueController.list));
 */
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

export function asyncHandler(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
