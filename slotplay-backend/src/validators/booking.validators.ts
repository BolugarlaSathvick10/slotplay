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
// bookingId comes from req.params.id — not required in the body

export const submitPaymentSchema = z.object({
  utrNumber: z
    .string()
    .trim()
    .regex(/^\d{12,16}$/, 'UTR must be 12 to 16 digits'),
  // Screenshot is uploaded as file via Multer, not in body
});

// ── Verify Payment (Owner) ────────────────────────────────────────────────────
// bookingId comes from req.params.id — not required in the body

export const verifyPaymentSchema = z.object({
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
// bookingId comes from req.params.id — not required in the body

export const cancelBookingSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

// ── Type exports ──────────────────────────────────────────────────────────────

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type SubmitPaymentInput = z.infer<typeof submitPaymentSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
export type ListBookingsInput = z.infer<typeof listBookingsSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
