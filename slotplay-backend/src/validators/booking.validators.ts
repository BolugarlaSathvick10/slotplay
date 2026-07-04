/**
 * validators/booking.validators.ts
 *
 * Zod validation schemas for booking endpoints.
 */

import { z } from 'zod';

// ── Create Booking ────────────────────────────────────────────────────────────

export const createBookingSchema = z.object({
  slotId: z.string().uuid('Invalid slot ID'),
  venueId: z.string().uuid('Invalid venue ID'),
  // User details may be pre-filled from session, but allow override
  userName: z.string().trim().min(2).max(120).optional(),
  userEmail: z.string().email().optional(),
  userPhone: z.string().regex(/^[6-9]\d{9}$/).optional(),
});

// ── Submit Payment (UPI) ──────────────────────────────────────────────────────

export const submitPaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  utrNumber: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{22}$/, 'Invalid UTR format (22 alphanumeric characters)'),
  // Screenshot is uploaded as file via Multer, not in body
});

// ── Verify Payment (Owner) ────────────────────────────────────────────────────

export const verifyPaymentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  approved: z.boolean(),
  rejectionReason: z.string().trim().max(500).optional(),
});

// ── List Bookings (User) ──────────────────────────────────────────────────────

export const listBookingsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z
    .enum(['awaiting_payment', 'confirmed', 'cancelled', 'rejected'])
    .optional(),
});

// ── Cancel Booking (User) ─────────────────────────────────────────────────────

export const cancelBookingSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
  reason: z.string().trim().max(500).optional(),
});

// ── Type exports ──────────────────────────────────────────────────────────────

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type ListBookingsInput = z.infer<typeof listBookingsSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
