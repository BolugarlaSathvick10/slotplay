/**
 * routes/booking.routes.ts
 */

import { Router } from 'express';
import * as bookingController from '@/controllers/booking.controller';
import { validate } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';
import { upload } from '@/middleware/upload';
import {
  createBookingSchema,
  submitPaymentSchema,
  verifyPaymentSchema,
  cancelBookingSchema,
} from '@/validators/booking.validators';

const router = Router();

// ── All routes require authentication ──────────────────────────────────────────

router.use(requireAuth);

// ── Create booking ────────────────────────────────────────────────────────────

/**
 * POST /api/bookings
 * Create a booking (locks slot for 30 minutes awaiting payment)
 */
router.post('/', validate(createBookingSchema), bookingController.createBooking);

// ── Submit payment (user uploads screenshot) ──────────────────────────────────

/**
 * POST /api/bookings/:id/payment
 * Submit UPI payment screenshot + UTR number
 * Multer middleware handles file upload for payment-screenshots category
 */
router.post(
  '/:id/payment',
  upload.single('screenshot'),
  validate(submitPaymentSchema),
  bookingController.submitPayment,
);

// ── List user's bookings ──────────────────────────────────────────────────────

/**
 * GET /api/bookings?page=1&limit=10&status=confirmed
 * List user's bookings (paginated)
 */
router.get('/', bookingController.listBookings);

// ── Get booking detail ────────────────────────────────────────────────────────

/**
 * GET /api/bookings/:id
 * Get single booking with full details (slot, venue, payment, verification)
 */
router.get('/:id', bookingController.getBooking);

// ── Cancel booking ────────────────────────────────────────────────────────────

/**
 * DELETE /api/bookings/:id
 * Cancel awaiting_payment bookings only
 */
router.delete('/:id', bookingController.cancelBooking);

// ── Owner routes (verify payments) ────────────────────────────────────────────

/**
 * POST /api/bookings/:id/verify
 * Owner verifies or rejects payment
 */
router.post(
  '/:id/verify',
  validate(verifyPaymentSchema),
  bookingController.verifyPayment,
);

export { router as bookingRouter };
