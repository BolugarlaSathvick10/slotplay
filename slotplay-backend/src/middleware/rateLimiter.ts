/**
 * middleware/rateLimiter.ts
 *
 * Pre-configured rate limiters for different route groups.
 * Using express-rate-limit with a memory store (suitable for single-instance Railway deploy).
 *
 * For multi-instance deployments in the future, replace MemoryStore with
 * a Redis-backed store (e.g. rate-limit-redis) — no route changes required.
 */

import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';

// ── Default API limiter ───────────────────────────────────────────────────────
// Applied to all /api/* routes
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  skip: () => env.NODE_ENV === 'test',
});

// ── Auth endpoints (stricter) ────────────────────────────────────────────────
// Prevents brute-force login / OTP guessing
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please wait 15 minutes.',
    code: 'AUTH_RATE_LIMIT',
  },
  skip: () => env.NODE_ENV === 'test',
});

// ── Upload endpoints ──────────────────────────────────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Upload limit reached. Please try again in an hour.',
    code: 'UPLOAD_RATE_LIMIT',
  },
  skip: () => env.NODE_ENV === 'test',
});
