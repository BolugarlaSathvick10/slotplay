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
import {
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  VerificationStatus,
} from '@/types';
import type { CreateBookingInput, VerifyPaymentInput } from '@/validators/booking.validators';

// ── Create a booking (locks slot) ──────────────────────────────────────────────

export async function createBooking(
  userId: string,
  input: CreateBookingInput,
): Promise<Booking> {
  const { slotId, venueId } = input;

  const slot = await Slot.findByPk(slotId);
  if (!slot) throw AppError.notFound('Slot');
  if (slot.venueId !== venueId) {
    throw new AppError('Slot does not belong to this venue', 400, 'INVALID_SLOT');
  }

  // Check no active booking on this slot
  const existingBooking = await Booking.findOne({
    where: {
      slotId,
      status: {
        [Op.in]: [
          BookingStatus.PENDING_PAYMENT,
          BookingStatus.PENDING_VERIFICATION,
          BookingStatus.CONFIRMED,
        ],
      },
    },
  });
  if (existingBooking) {
    throw new AppError('This slot is already booked', 409, 'SLOT_UNAVAILABLE');
  }

  const bookingRef = generateBookingRef();
  const booking = await Booking.create({
    userId,
    slotId,
    venueId,
    bookingRef,
    status: BookingStatus.PENDING_PAYMENT,
    totalAmount: Number(slot.price),
  });

  // Initial payment record — userId is required by PaymentAttributes
  await Payment.create({
    bookingId: booking.id,
    userId,
    amount:   Number(slot.price),   // slot.price — correct field on Slot
    currency: 'INR',
    method:   PaymentMethod.UPI_MANUAL, // 'upi_manual' — correct enum value
    status:   PaymentStatus.PENDING,
  });

  logger.info('[BookingService] Created booking', { bookingId: booking.id, bookingRef, userId, slotId });
  return booking;
}

// ── Submit payment (upload screenshot + UTR) ──────────────────────────────────

export async function submitPayment(
  userId: string,
  bookingId: string,
  utrNumber: string,
  screenshotUrl: string,
): Promise<PaymentVerification> {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: Venue, as: 'venue' },
      { model: User,  as: 'user'  },
    ],
  });

  if (!booking) throw AppError.notFound('Booking');
  if (booking.userId !== userId) {
    throw new AppError('This booking does not belong to you', 403, 'FORBIDDEN');
  }
  if (booking.status !== BookingStatus.PENDING_PAYMENT) {
    throw new AppError('This booking is not awaiting payment', 400, 'INVALID_STATE');
  }

  const payment = await Payment.findOne({ where: { bookingId } });
  if (!payment) throw AppError.notFound('Payment');

  const verification = await PaymentVerification.create({
    paymentId:     payment.id,
    bookingId,
    submittedBy:   userId,
    utrNumber,
    screenshotKey: screenshotUrl, // key and url are the same at submission time
    screenshotUrl,
    status:        VerificationStatus.SUBMITTED,
    submittedAt:   new Date(),
  });

  await payment.update({ status: PaymentStatus.SUBMITTED });

  // Notify owner — include userName which is now required by notifyPaymentSubmitted
  const venue = (booking as any).venue;
  const user  = (booking as any).user;
  await NotificationService.notifyPaymentSubmitted(venue.ownerId, {
    bookingRef: booking.bookingRef,
    userName:   user.name,
    userEmail:  user.email,
    venueName:  venue.name,
    amount:     booking.totalAmount,
    utrNumber,
  });

  logger.info('[BookingService] Submitted payment', { bookingId, verificationId: verification.id, utrNumber });
  return verification;
}

// ── Verify payment (owner approves or rejects) ────────────────────────────────

export async function verifyPayment(
  ownerId: string,
  input: VerifyPaymentInput,
): Promise<void> {
  const { bookingId, approved, rejectionReason } = input;

  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: Venue, as: 'venue' },
      { model: User,  as: 'user'  },
      { model: Slot,  as: 'slot'  },
    ],
  });

  if (!booking) throw AppError.notFound('Booking');

  const venue = (booking as any).venue;
  if (venue.ownerId !== ownerId) {
    throw new AppError('You do not own this venue', 403, 'FORBIDDEN');
  }

  const verification = await PaymentVerification.findOne({
    where: { bookingId },
    order: [['createdAt', 'DESC']],
  });
  if (!verification) throw AppError.notFound('Payment Verification');

  const payment = await Payment.findByPk(verification.paymentId);
  const user    = (booking as any).user;
  const slot    = (booking as any).slot;

  if (approved) {
    await verification.update({ status: VerificationStatus.APPROVED });
    if (payment) await payment.update({ status: PaymentStatus.VERIFIED });
    await booking.update({ status: BookingStatus.CONFIRMED });

    await NotificationService.notifyBookingConfirmed(booking.userId, {
      bookingRef: booking.bookingRef,
      venueName:  venue.name,
      address:    venue.address,
      date:       slot.date,
      startTime:  slot.startTime,
      endTime:    slot.endTime,
      amount:     booking.totalAmount,
      userEmail:  user.email,
    });

    logger.info('[BookingService] Payment approved', { bookingId, verificationId: verification.id });
  } else {
    await verification.update({ status: VerificationStatus.REJECTED, reviewNote: rejectionReason });
    if (payment) await payment.update({ status: PaymentStatus.REJECTED });
    await booking.update({ status: BookingStatus.REJECTED });

    await NotificationService.notifyPaymentRejected(booking.userId, {
      bookingRef: booking.bookingRef,
      venueName:  venue.name,
      reason:     rejectionReason,
      userEmail:  user.email,
    });

    logger.info('[BookingService] Payment rejected', { bookingId, verificationId: verification.id });
  }
}

// ── Get user's bookings ───────────────────────────────────────────────────────

export async function getUserBookings(
  userId: string,
  page: number = 1,
  limit: number = 10,
  status?: BookingStatus,
): Promise<{ data: Booking[]; pagination: { page: number; limit: number; total: number } }> {
  const offset = (page - 1) * limit;
  const where: any = { userId };
  if (status) where.status = status;

  const { count, rows } = await Booking.findAndCountAll({
    where,
    include: [
      { model: Venue,   as: 'venue'   },
      { model: Slot,    as: 'slot'    },
      { model: Payment, as: 'payment' },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return { data: rows, pagination: { page, limit, total: count } };
}

// ── Get booking detail ────────────────────────────────────────────────────────

export async function getBookingDetail(bookingId: string, userId: string): Promise<Booking> {
  const booking = await Booking.findByPk(bookingId, {
    include: [
      { model: Venue,               as: 'venue'        },
      { model: Slot,                as: 'slot'         },
      { model: Payment,             as: 'payment'      },
      { model: PaymentVerification, as: 'verification' },
    ],
  });

  if (!booking) throw AppError.notFound('Booking');
  if (booking.userId !== userId) {
    throw new AppError('This booking does not belong to you', 403, 'FORBIDDEN');
  }

  return booking;
}

// ── Cancel booking ────────────────────────────────────────────────────────────

export async function cancelBooking(bookingId: string, userId: string): Promise<void> {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw AppError.notFound('Booking');
  if (booking.userId !== userId) {
    throw new AppError('This booking does not belong to you', 403, 'FORBIDDEN');
  }
  if (booking.status !== BookingStatus.PENDING_PAYMENT) {
    throw new AppError('Only pending_payment bookings can be cancelled', 400, 'CANNOT_CANCEL');
  }

  await booking.update({ status: BookingStatus.CANCELLED });
  logger.info('[BookingService] Booking cancelled', { bookingId, userId });
}

// ── Get pending verifications for owner ───────────────────────────────────────

export async function getPendingVerifications(
  ownerId: string,
  page: number = 1,
  limit: number = 20,
): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number } }> {
  const offset = (page - 1) * limit;

  const { count, rows } = await Booking.findAndCountAll({
    where: { status: BookingStatus.PENDING_PAYMENT },
    include: [
      { model: Venue,               as: 'venue',        where: { ownerId }, required: true },
      { model: Slot,                as: 'slot'         },
      { model: User,                as: 'user'         },
      { model: Payment,             as: 'payment'      },
      { model: PaymentVerification, as: 'verification' },
    ],
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    subQuery: false,
  });

  return { data: rows.map(b => b.toJSON()), pagination: { page, limit, total: count } };
}
