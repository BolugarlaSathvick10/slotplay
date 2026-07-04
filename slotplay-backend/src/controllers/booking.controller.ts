/**
 * controllers/booking.controller.ts
 */

import { Request, Response, NextFunction } from 'express';
import * as BookingService from '@/services/booking/BookingService';
import { sendSuccess, sendCreated, sendPaginated } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/helpers';
import { AppError } from '@/utils/AppError';

// ── POST /api/bookings (create booking) ────────────────────────────────────────

export const createBooking = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const booking = await BookingService.createBooking(
      req.session.userId!,
      req.body,
    );

    sendCreated(
      res,
      booking,
      'Booking created. You have 30 minutes to submit payment.',
    );
  },
);

// ── POST /api/bookings/:id/payment (submit payment) ──────────────────────────

export const submitPayment = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { utrNumber } = req.body;

    // File is attached by Multer middleware
    if (!req.file) {
      throw new AppError('Payment screenshot is required', 400, 'MISSING_FILE');
    }

    // File path or URL depends on storage adapter
    const screenshotUrl = req.file.path || `/uploads/payment-screenshots/${req.file.filename}`;

    const verification = await BookingService.submitPayment(
      req.session.userId!,
      id,
      utrNumber,
      screenshotUrl,
    );

    sendCreated(
      res,
      verification,
      'Payment submitted. The venue owner will verify within 24 hours.',
    );
  },
);

// ── POST /api/bookings/:id/verify (owner verify payment) ──────────────────────

export const verifyPayment = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { id } = req.params;

    await BookingService.verifyPayment(req.session.userId!, {
      bookingId: id,
      ...req.body,
    });

    sendSuccess(
      res,
      null,
      req.body.approved
        ? 'Payment verified. User has been notified.'
        : 'Payment rejected. User has been notified.',
    );
  },
);

// ── GET /api/bookings (user's bookings) ────────────────────────────────────────

export const listBookings = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as any;

    const result = await BookingService.getUserBookings(
      req.session.userId!,
      page,
      limit,
      status,
    );

    sendPaginated(
      res,
      result.data,
      {
        ...result.pagination,
        pages: Math.ceil(result.pagination.total / result.pagination.limit),
      },
      'Bookings retrieved successfully',
    );
  },
);

// ── GET /api/bookings/:id (booking detail) ─────────────────────────────────────

export const getBooking = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const booking = await BookingService.getBookingDetail(
      req.params.id,
      req.session.userId!,
    );

    sendSuccess(res, booking);
  },
);

// ── DELETE /api/bookings/:id (cancel booking) ──────────────────────────────────

export const cancelBooking = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    await BookingService.cancelBooking(req.params.id, req.session.userId!);

    sendSuccess(res, null, 'Booking cancelled successfully');
  },
);

// ── GET /api/owner/verifications (pending payment verifications) ────────────────

export const getPendingVerifications = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await BookingService.getPendingVerifications(
      req.session.userId!,
      page,
      limit,
    );

    sendPaginated(
      res,
      result.data,
      {
        ...result.pagination,
        pages: Math.ceil(result.pagination.total / result.pagination.limit),
      },
      'Pending verifications retrieved',
    );
  },
);
