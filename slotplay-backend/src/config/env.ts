/**
 * config/env.ts
 *
 * Central environment configuration.
 * All process.env access is isolated here so the rest of the codebase
 * imports typed, validated values rather than raw strings.
 *
 * Throws at startup if any required variable is missing — fail fast
 * rather than discovering missing config at runtime.
 */

import { z } from 'zod';

// ── Schema ────────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Session
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  SESSION_MAX_AGE_MS: z.coerce.number().default(604800000), // 7 days
  SESSION_TABLE_NAME: z.string().default('sessions'),

  // CORS
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // Email
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().default('SlotPlay <noreply@slotplay.in>'),

  // Storage
  STORAGE_PROVIDER: z.enum(['local', 'cloudinary']).default('local'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(5),

  // Cloudinary (optional in v1)
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Payment
  PAYMENT_PROVIDER: z.enum(['manual_upi', 'razorpay', 'stripe']).default('manual_upi'),

  // Razorpay (optional in v1)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  // Slot generation
  SLOT_GENERATION_DAYS_AHEAD: z.coerce.number().default(30),
  SLOT_GENERATION_CRON: z.string().default('0 0 * * *'),
  BOOKING_EXPIRY_MINUTES: z.coerce.number().default(30),
});

// ── Parse & export ────────────────────────────────────────────────────────────

const _parsed = envSchema.safeParse(process.env);

if (!_parsed.success) {
  console.error('\n❌  Invalid environment configuration:\n');
  _parsed.error.issues.forEach((issue) => {
    console.error(`  • ${issue.path.join('.')}: ${issue.message}`);
  });
  console.error('\nPlease check your .env file against .env.example\n');
  process.exit(1);
}

export const env = _parsed.data;

export type Env = typeof env;
