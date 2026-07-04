/**
 * services/booking/BookingService.ts
 *
 * Complete booking logic: creation, slot locking, payment, verification.
 */

import { Op } from 'sequelize';
import { Booking, Slot, Payment, PaymentVerification, Venue, User } from '@/models';






import { AppError } from '@/utils/AppError';
import { generateBookingRef } from '@/utils/helpers';
import * as NotificationService from '@/services/notification/NotificationService';
import { logger } from '@/config/logger';
import { BookingStatus, PaymentStatus } from '@/types';
import type { CreateBookingInput, VerifyPaymentInput } from '@/validators/booking.validators';

// ── Create a booking (locks slot for 30 minutes) ────────────────────────────────

export async function createBooking(
  userId: string,
  input: CreateBookingInput,
): Promise<Booking> {
  const { slotId, venueId } = input;

  // Verify slot exists and is available
  const slot = await Slot.findByPk(slotId);
  if (!slot) throw AppError.notFound('Slot');
  if (slot.venueId !== venueId) {
    throw new AppError('Slot does not belong to this venue', 400, 'INVALID_SLOT');
  }

  // Check if slot already has a booking
  const existingBooking = await Booking.findOne({
    where: {
      slotId,
      status: { [Op.in]: ['pending_payment', 'pending_verification', 'confirmed'] },
    },
  });

  if (existingBooking) {
    throw new AppError('This slot is already booked', 409, 'SLOT_UNAVAILABLE');
  }

  // Create booking in awaiting_payment state
  const bookingRef = generateBookingRef();
  const booking = await Booking.create({
    userId,
    slotId,
    venueId,
    bookingRef,
    status: 'pending_payment',
    totalAmount: Number(slot.price),
  });

  // Create initial payment record
  await Payment.create({
    bookingId: booking.id,
    amount: slot.pricePerHour,
    currency: 'INR',
    method: 'upi',
    status: 'pending' as PaymentStatus,
  });

  logger.info('[BookingService] Created booking', {
    bookingId: booking.id,
    bookingRef,
    userId,
    slotId,
  });

  return booking;
}

// ── Submit payment (upload screenshot + UTR) ──────────────────────────────────

export async function submitPayment(
  userId: string,
  bookingId: string,
  utrNumber: string,
  screenshotUrl: string,
): Promise<PaymentVerification> {
  // Verify booking exists and belongs to user
  const booking = await Booking.findByPk(bookingId, {
    include: [{ model: Venue, as: 'venue' }, { model: User, as: 'user' }],
  });

  if (!booking) throw AppError.notFound('Booking');
  if (booking.userId !== userId) {
    throw new AppError('This booking does not belong to you', 403, 'FORBIDDEN');
  }

  if (booking.status !== 'pending_payment') {
    throw new AppError(
      'This booking is not awaiting payment',
      400,
      'INVALID_STATE',
    );
  }

  // Get the payment
  const payment = await Payment.findOne({ where: { bookingId } });
  if (!payment) throw AppError.notFound('Payment');

  // Create payment verification record
  const verification = await PaymentVerification.create({
    paymentId: payment.id,
    bookingId,
    utrNumber,
    screenshotUrl,
    status: 'submitted',
    submittedAt: new Date(),
  });

  // Update payment status
  await payment.update({ status: 'submitted' as PaymentStatus });

  // Notify owner
  const venue = booking.venue as any;
  await NotificationService.notifyPaymentSubmitted(venue.ownerId, {
    bookingRef: booking.bookingRef,
    userEmail: (booking.user as any).email,
    venueName: venue.name,
    amount: booking.totalAmount,
    utrNumber,
  });

  logger.info('[BookingService] Submitted payment', {
    bookingId,
    verificationId: verification.id,
    utrNumber,
  });

  return verification;
}

// ── Verify payment (owner approves or rejects) ────────────────────────────────

export async function verifyPayment(
  ownerId: string,
  input: VerifyPaymentInput,
): Promise<void> {
  const { bookingId, approved, rejectionReason } = input;

  // Verify booking and ownership
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: Venue, as: 'venue' },
      { model: User, as: 'user' },
      { model: Slot, as: 'slot' },
    ],
  });

  if (!booking) throw AppError.notFound('Booking');

  const venue = booking.venue as any;
  if (venue.ownerId !== ownerId) {
    throw new AppError('You do not own this venue', 403, 'FORBIDDEN');
  }

  // Get payment verification
  const verification = await PaymentVerification.findOne({
    where: { bookingId },
    order: [['createdAt', 'DESC']],
  });

  if (!verification) throw AppError.notFound('Payment Verification');

  if (approved) {
    // Approve payment
    await verification.update({ status: 'approved' });

    // Update payment status
    const payment = await Payment.findByPk(verification.paymentId);
    if (payment) {
      await payment.update({ status: 'verified' as PaymentStatus });
    }

    // Mark booking as confirmed
    await booking.update({ status: 'confirmed' as BookingStatus });

    // Notify user
    const user = booking.user as any;
    const slot = booking.slot as any;
    await NotificationService.notifyBookingConfirmed(booking.userId, {
      bookingRef: booking.bookingRef,
      venueName: venue.name,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      amount: booking.totalAmount,
      userEmail: user.email,
    });

    logger.info('[BookingService] Payment approved', {
      bookingId,
      verificationId: verification.id,
    });
  } else {
    // Reject payment
    await verification.update({
      status: 'rejected',
      reviewNote: rejectionReason,
    });

    // Update payment status
    const payment = await Payment.findByPk(verification.paymentId);
    if (payment) {
      await payment.update({ status: 'rejected' as PaymentStatus });
    }

    // Mark booking as rejected (will free up the slot)
    await booking.update({ status: 'rejected' as BookingStatus });

    // Notify user
    const user = booking.user as any;
    await NotificationService.notifyPaymentRejected(booking.userId, {
      bookingRef: booking.bookingRef,
      venueName: venue.name,
      reason: rejectionReason,
      userEmail: user.email,
    });

    logger.info('[BookingService] Payment rejected', {
      bookingId,
      verificationId: verification.id,
      reason: rejectionReason,
    });
  }
}

// ── Get user's bookings ───────────────────────────────────────────────────────

export async function getUserBookings(
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: BookingStatus,
): Promise<{
  data: Booking[];
  pagination: { page: number; limit: number; total: number };
}> {
  const offset = (page - 1) * limit;
  const where: any = { userId };
  if (status) where.status = status;

  const { count, rows } = await Booking.findAndCountAll({
    where,
    include: [
      { model: Venue, as: 'venue' },
      { model: Slot, as: 'slot' },
      { model: Payment, as: 'payment' },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    data: rows,
    pagination: { page, limit, total: count },
  };
}

// ── Get booking detail ────────────────────────────────────────────────────────

export async function getBookingDetail(bookingId: string, userId: string): Promise<Booking> {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: Venue, as: 'venue' },
      { model: Slot, as: 'slot' },
      { model: Payment, as: 'payment' },
      {
        model: PaymentVerification,
        as: 'verification',
      },
    ],
  });

  if (!booking) throw AppError.notFound('Booking');
  if (booking.userId !== userId) {
    throw new AppError('This booking does not belong to you', 403, 'FORBIDDEN');
  }

  return booking;
}

// ── Cancel booking (user can only cancel awaiting_payment) ────────────────────

export async function cancelBooking(
  bookingId: string,
  userId: string,
): Promise<void> {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw AppError.notFound('Booking');
  if (booking.userId !== userId) {
    throw new AppError('This booking does not belong to you', 403, 'FORBIDDEN');
  }

  if (booking.status !== 'pending_payment') {
    throw new AppError(
      'Only awaiting_payment bookings can be cancelled',
      400,
      'CANNOT_CANCEL',
    );
  }

  await booking.update({ status: 'cancelled' as BookingStatus });

  logger.info('[BookingService] Booking cancelled', { bookingId, userId });
}

// ── Get pending payment verifications for owner ────────────────────────────────

export async function getPendingVerifications(
  ownerId: string,
  page: number = 1,
  limit: number = 20,
): Promise<{
  data: any[];
  pagination: { page: number; limit: number; total: number };
}> {
  const offset = (page - 1) * limit;

  // Get bookings where owner's venue has awaiting payment
  const { count, rows } = await Booking.findAndCountAll({
    where: {
      status: 'pending_payment',
    },
    include: [
      {
        model: Venue,
        as: 'venue',
        where: { ownerId },
        required: true,
      },
      { model: Slot, as: 'slot' },
      { model: User, as: 'user' },
      {
        model: Payment,
        as: 'payment',
      },
      {
        model: PaymentVerification,
        as: 'verification',
      },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    distinct: true,
    subQuery: false,
  });

  return {
    data: rows.map((b) => b.toJSON()),
    pagination: { page, limit, total: count },
  };
}
