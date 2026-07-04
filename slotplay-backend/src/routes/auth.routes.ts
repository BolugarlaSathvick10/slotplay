/**
 * routes/auth.routes.ts
 *
 * All /api/auth/* routes.
 *
 * Middleware order per route:
 *   authLimiter (rate limit) → validate(schema) → controller
 */

import { Router } from 'express';
import * as authController from '@/controllers/auth.controller';
import { validate } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';
import { authLimiter } from '@/middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '@/validators/auth.validators';

const router = Router();

// ── Public routes (no auth required) ─────────────────────────────────────────

/** Register a new account */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register,
);

/** Login with email + password */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login,
);

/** Resend email verification OTP */
router.post(
  '/resend-otp',
  authLimiter,
  validate(resendOtpSchema),
  authController.resendOtp,
);

/** Request a password reset OTP */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

/** Reset password using OTP */
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

// ── Session-required routes ───────────────────────────────────────────────────

/**
 * Verify email OTP.
 * Session must be active (set during register before isVerified=true).
 */
router.post(
  '/verify-otp',
  authLimiter,
  validate(verifyOtpSchema),
  authController.verifyOtp,
);

/** Get current session user — used by frontend middleware to check auth */
router.get('/me', authController.getMe);

/** Logout and destroy session */
router.post('/logout', requireAuth, authController.logout);

/** Update own profile */
router.put(
  '/me',
  requireAuth,
  validate(updateProfileSchema),
  authController.updateProfile,
);

export { router as authRouter };
