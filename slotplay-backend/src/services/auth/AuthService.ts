/**
 * services/auth/AuthService.ts
 *
 * All authentication business logic lives here.
 * Controllers call this service — they never touch models directly.
 *
 * Responsibilities:
 *   - Register user with bcrypt-hashed password
 *   - Login with email + password verification
 *   - Generate and verify OTP tokens
 *   - Email verification flow
 *   - Forgot / reset password flow
 */

import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { User } from '@/models/User';
import { Role } from '@/models/Role';
import { OtpToken } from '@/models/OtpToken';
import { AppError } from '@/utils/AppError';
import { generateOtp, otpExpiresAt } from '@/utils/helpers';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '@/services/email/EmailService';
import { logger } from '@/config/logger';
import { UserRole, OtpPurpose } from '@/types';

const BCRYPT_ROUNDS = 12;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  roleId: number;
  role: string;
  isVerified: boolean;
  avatarUrl: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Map roleId to role name string */
async function getRoleName(roleId: number): Promise<string> {
  const role = await Role.findByPk(roleId);
  return role?.name ?? 'user';
}

/** Build a safe AuthUser object to store in session / return to client */
function toAuthUser(user: User, roleName: string): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    roleId: user.roleId,
    role: roleName,
    isVerified: user.isVerified,
    avatarUrl: user.avatarUrl,
  };
}

/** Invalidate any previous unused OTPs for this user + purpose */
async function invalidatePreviousOtps(
  userId: string,
  purpose: OtpPurpose,
): Promise<void> {
  await OtpToken.update(
    { isUsed: true },
    {
      where: {
        userId,
        purpose,
        isUsed: false,
      },
    },
  );
}

// ── Service methods ───────────────────────────────────────────────────────────

/**
 * Register a new user account.
 * Sends a verification OTP email immediately after creation.
 */
export async function register(input: RegisterInput): Promise<AuthUser> {
  const { name, email, password, phone } = input;

  // Check for existing account
  const existing = await User.findOne({ where: { email: email.toLowerCase() } });
  if (existing) {
    throw AppError.conflict('An account with this email already exists');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user with role_id=1 (user)
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
    phone: phone?.trim() ?? undefined,
    roleId: 1,
    isVerified: false,
  });

  logger.info('[Auth] User registered', { userId: user.id, email: user.email });

  // Send verification OTP
  await issueAndSendOtp(user, OtpPurpose.VERIFY);

  const roleName = await getRoleName(user.roleId);
  return toAuthUser(user, roleName);
}

/**
 * Authenticate a user with email and password.
 * Returns AuthUser on success for session population.
 */
export async function login(input: LoginInput): Promise<AuthUser> {
  const { email, password } = input;

  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  // Use a constant-time comparison to prevent timing attacks
  // Even if user doesn't exist, still run bcrypt.compare on a dummy hash
  const dummyHash = '$2a$12$dummy.hash.to.prevent.timing.attacks.padding.xxx';
  const passwordHash = user?.passwordHash ?? dummyHash;

  const isMatch = await bcrypt.compare(password, passwordHash);

  if (!user || !isMatch) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.isVerified) {
    // Re-send OTP if they try to log in without verifying
    await issueAndSendOtp(user, OtpPurpose.VERIFY);
    throw new AppError(
      'Please verify your email before logging in. A new verification code has been sent.',
      403,
      'EMAIL_NOT_VERIFIED',
    );
  }

  logger.info('[Auth] User logged in', { userId: user.id, email: user.email });

  const roleName = await getRoleName(user.roleId);
  return toAuthUser(user, roleName);
}

/**
 * Verify email OTP and mark the user as verified.
 */
export async function verifyEmailOtp(
  userId: string,
  otpCode: string,
): Promise<AuthUser> {
  const token = await OtpToken.findOne({
    where: {
      userId,
      otpCode,
      purpose: OtpPurpose.VERIFY,
      isUsed: false,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!token) {
    throw new AppError('Invalid or expired verification code', 400, 'INVALID_OTP');
  }

  // Mark token as used
  await token.update({ isUsed: true });

  // Mark user as verified
  const user = await User.findByPk(userId);
  if (!user) throw AppError.notFound('User');

  await user.update({ isVerified: true });

  logger.info('[Auth] Email verified', { userId });

  const roleName = await getRoleName(user.roleId);
  return toAuthUser(user, roleName);
}

/**
 * Resend a verification OTP.
 * Rate-limited by invalidating the previous one and issuing a fresh one.
 */
export async function resendVerificationOtp(email: string): Promise<void> {
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    // Return silently — don't reveal whether the email exists
    return;
  }

  if (user.isVerified) {
    throw new AppError('This account is already verified', 400, 'ALREADY_VERIFIED');
  }

  await issueAndSendOtp(user, OtpPurpose.VERIFY);
}

/**
 * Initiate forgot-password flow.
 * Sends a reset OTP to the user's email.
 * Always resolves successfully — never reveals if email exists.
 */
export async function forgotPassword(email: string): Promise<void> {
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  // Silent return if user not found (prevents email enumeration)
  if (!user) return;

  await issueAndSendOtp(user, OtpPurpose.RESET);
  logger.info('[Auth] Password reset OTP sent', { email });
}

/**
 * Reset password using OTP.
 * Validates the OTP then updates the password hash.
 */
export async function resetPassword(
  email: string,
  otpCode: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findOne({
    where: { email: email.toLowerCase().trim() },
  });

  if (!user) {
    throw new AppError('Invalid reset request', 400, 'INVALID_RESET');
  }

  const token = await OtpToken.findOne({
    where: {
      userId: user.id,
      otpCode,
      purpose: OtpPurpose.RESET,
      isUsed: false,
      expiresAt: { [Op.gt]: new Date() },
    },
  });

  if (!token) {
    throw new AppError('Invalid or expired reset code', 400, 'INVALID_OTP');
  }

  // Mark token used before changing password (prevents replay)
  await token.update({ isUsed: true });

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.update({ passwordHash });

  logger.info('[Auth] Password reset successfully', { userId: user.id });
}

/**
 * Return the current session user's full profile.
 */
export async function getMe(userId: string): Promise<AuthUser> {
  const user = await User.findByPk(userId);
  if (!user) throw AppError.notFound('User');

  const roleName = await getRoleName(user.roleId);
  return toAuthUser(user, roleName);
}

/**
 * Update the current user's profile fields.
 */
export async function updateProfile(
  userId: string,
  updates: { name?: string; phone?: string },
): Promise<AuthUser> {
  const user = await User.findByPk(userId);
  if (!user) throw AppError.notFound('User');

  await user.update({
    name: updates.name?.trim() ?? user.name,
    phone: updates.phone?.trim() ?? user.phone,
  });

  const roleName = await getRoleName(user.roleId);
  return toAuthUser(user, roleName);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * Generate a fresh OTP, persist it, and send the appropriate email.
 */
async function issueAndSendOtp(user: User, purpose: OtpPurpose): Promise<void> {
  // Invalidate any previous OTPs for this purpose
  await invalidatePreviousOtps(user.id, purpose);

  const otpCode = generateOtp(6);
  const expiresAt = otpExpiresAt(10); // 10 minutes

  await OtpToken.create({
    userId: user.id,
    otpCode,
    purpose,
    expiresAt,
  });

  if (purpose === OtpPurpose.VERIFY) {
    await sendVerificationEmail(user.email, user.name, otpCode);
  } else {
    await sendPasswordResetEmail(user.email, user.name, otpCode);
  }

  logger.debug('[Auth] OTP issued', {
    userId: user.id,
    purpose,
    expiresAt,
  });
}
