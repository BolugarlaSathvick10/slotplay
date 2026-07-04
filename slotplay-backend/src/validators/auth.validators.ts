/**
 * validators/auth.validators.ts
 *
 * Zod validation schemas for all authentication endpoints.
 * Used in controllers before calling the service layer.
 */

import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must not exceed 72 characters') // bcrypt limit
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name must not exceed 120 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: passwordSchema,
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const verifyOtpSchema = z.object({
  otpCode: z
    .string()
    .length(6, 'Verification code must be 6 digits')
    .regex(/^\d{6}$/, 'Verification code must contain only digits'),
});

export const resendOtpSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address').toLowerCase(),
  otpCode: z
    .string()
    .length(6, 'Reset code must be 6 digits')
    .regex(/^\d{6}$/, 'Reset code must contain only digits'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(120, 'Name must not exceed 120 characters')
    .optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
    .optional()
    .or(z.literal('')),
});

// ── Inferred types ────────────────────────────────────────────────────────────
export type RegisterInput    = z.infer<typeof registerSchema>;
export type LoginInput       = z.infer<typeof loginSchema>;
export type VerifyOtpInput   = z.infer<typeof verifyOtpSchema>;
export type ResendOtpInput   = z.infer<typeof resendOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput  = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput  = z.infer<typeof updateProfileSchema>;
