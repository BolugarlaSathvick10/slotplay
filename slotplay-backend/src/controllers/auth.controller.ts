/**
 * controllers/auth.controller.ts
 *
 * HTTP layer for authentication.
 * Controllers are intentionally thin — all business logic lives in AuthService.
 *
 * Responsibilities:
 *   - Extract validated inputs from req.body
 *   - Call the appropriate AuthService method
 *   - Populate / destroy req.session
 *   - Send standardised API responses
 */

import { Request, Response, NextFunction } from 'express';
import * as AuthService from '@/services/auth/AuthService';
import { sendSuccess, sendError } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/helpers';
import { logger } from '@/config/logger';

// ── POST /api/auth/register ───────────────────────────────────────────────────
export const register = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const user = await AuthService.register(req.body);

    sendSuccess(
      res,
      {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      'Account created. Please check your email for a verification code.',
      201,
    );
  },
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export const login = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const user = await AuthService.login(req.body);

    // Populate session — this is what authenticates future requests
    req.session.userId = user.id;
    req.session.role   = user.role as 'user' | 'owner' | 'admin';
    req.session.email  = user.email;

    logger.info('[Auth Controller] Session created', {
      userId: user.id,
      sessionId: req.session.id,
    });

    sendSuccess(res, user, 'Logged in successfully');
  },
);

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
export const logout = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.session.userId;

    req.session.destroy((err) => {
      if (err) {
        logger.error('[Auth Controller] Session destroy failed', { error: err.message });
        next(err);
        return;
      }

      // Clear the session cookie from the browser
      res.clearCookie('slotplay.sid', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      });

      logger.info('[Auth Controller] Session destroyed', { userId });
      sendSuccess(res, null, 'Logged out successfully');
    });
  },
);

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// Returns the current session user's profile — used by frontend middleware
export const getMe = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    if (!req.session?.userId) {
      sendError(res, 'Not authenticated', 401, 'UNAUTHORISED');
      return;
    }

    const user = await AuthService.getMe(req.session.userId);
    sendSuccess(res, user);
  },
);

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
export const verifyOtp = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    // userId comes from the session (set during register, before verification)
    if (!req.session?.userId) {
      sendError(res, 'Session expired. Please register again.', 401, 'SESSION_EXPIRED');
      return;
    }

    const user = await AuthService.verifyEmailOtp(
      req.session.userId,
      req.body.otpCode,
    );

    // Update session with verified status
    req.session.userId = user.id;
    req.session.role   = user.role as 'user' | 'owner' | 'admin';
    req.session.email  = user.email;

    sendSuccess(res, user, 'Email verified successfully');
  },
);

// ── POST /api/auth/resend-otp ─────────────────────────────────────────────────
export const resendOtp = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    await AuthService.resendVerificationOtp(req.body.email);
    // Always return 200 — never reveal if email exists
    sendSuccess(
      res,
      null,
      'If that email is registered and unverified, a new code has been sent.',
    );
  },
);

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
export const forgotPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    await AuthService.forgotPassword(req.body.email);
    sendSuccess(
      res,
      null,
      'If that email is registered, a password reset code has been sent.',
    );
  },
);

// ── POST /api/auth/reset-password ────────────────────────────────────────────
export const resetPassword = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    await AuthService.resetPassword(
      req.body.email,
      req.body.otpCode,
      req.body.newPassword,
    );
    sendSuccess(res, null, 'Password reset successfully. Please log in.');
  },
);

// ── PUT /api/auth/me ──────────────────────────────────────────────────────────
export const updateProfile = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const user = await AuthService.updateProfile(req.session.userId!, req.body);
    sendSuccess(res, user, 'Profile updated successfully');
  },
);
