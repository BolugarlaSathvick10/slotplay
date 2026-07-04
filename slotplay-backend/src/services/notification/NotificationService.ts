/**
 * services/notification/NotificationService.ts
 *
 * Handles both database notifications and email notifications.
 */



import { Notification, User } from '@/models';
import {
  sendBookingConfirmationEmail,
  sendPaymentSubmittedNotificationEmail,
  sendPaymentRejectedEmail,
} from '@/services/email/EmailService';
import { Notification, User } from '@/models';
import { logger } from '@/config/logger';
import { Notification, User } from '@/models';
import { NotificationType } from '@/types';

// ── Create a notification in the database ──────────────────────────────────────

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
): Promise<Notification> {
  const notification = await Notification.create({
    userId,
    type,
    title,
    body,
    isRead: false,
  });

  logger.debug('[NotificationService] Created notification', {
    notificationId: notification.id,
    userId,
    type,
  });

  return notification;
}

// ── Booking confirmed ─────────────────────────────────────────────────────────

export async function notifyBookingConfirmed(
  userId: string,
  bookingDetails: {
    bookingRef: string;
    venueName: string;
    date: string;
    startTime: string;
    endTime: string;
    amount: number;
    userEmail: string;
  },
): Promise<void> {
  const user = await User.findByPk(userId);
  if (!user) return;

  // Store in DB
  await createNotification(
    userId,
    'booking_confirmed',
    'Booking Confirmed! 🎉',
    `Your booking at ${bookingDetails.venueName} on ${bookingDetails.date} has been confirmed.`,
  );

  // Send email
  await sendBookingConfirmationEmail(bookingDetails.userEmail, user.name, {
    bookingRef: bookingDetails.bookingRef,
    venueName: bookingDetails.venueName,
    date: bookingDetails.date,
    startTime: bookingDetails.startTime,
    endTime: bookingDetails.endTime,
    amount: bookingDetails.amount,
  });

  logger.info('[NotificationService] Sent booking confirmed notification', {
    userId,
    bookingRef: bookingDetails.bookingRef,
  });
}

// ── Payment submitted (notify owner) ───────────────────────────────────────────

export async function notifyPaymentSubmitted(
  ownerId: string,
  paymentDetails: {
    bookingRef: string;
    userEmail: string;
    venueName: string;
    amount: number;
    utrNumber: string;
  },
): Promise<void> {
  const owner = await User.findByPk(ownerId);
  if (!owner) return;

  // Store in DB
  await createNotification(
    ownerId,
    'payment_submitted',
    'Payment Awaiting Verification ⏳',
    `${paymentDetails.userEmail} submitted payment for booking ${paymentDetails.bookingRef}. Please verify.`,
  );

  // Send email
  await sendPaymentSubmittedNotificationEmail(owner.email, owner.name, {
    bookingRef: paymentDetails.bookingRef,
    userEmail: paymentDetails.userEmail,
    venueName: paymentDetails.venueName,
    amount: paymentDetails.amount,
    utrNumber: paymentDetails.utrNumber,
  });

  logger.info('[NotificationService] Sent payment submitted notification', {
    ownerId,
    bookingRef: paymentDetails.bookingRef,
  });
}

// ── Payment rejected (notify user) ─────────────────────────────────────────────

export async function notifyPaymentRejected(
  userId: string,
  rejectionDetails: {
    bookingRef: string;
    venueName: string;
    reason?: string;
    userEmail: string;
  },
): Promise<void> {
  const user = await User.findByPk(userId);
  if (!user) return;

  // Store in DB
  await createNotification(
    userId,
    'payment_rejected',
    'Payment Not Verified ❌',
    `Your payment for booking ${rejectionDetails.bookingRef} could not be verified. ${rejectionDetails.reason ? `Reason: ${rejectionDetails.reason}` : ''}`,
  );

  // Send email
  await sendPaymentRejectedEmail(
    rejectionDetails.userEmail,
    user.name,
    {
      bookingRef: rejectionDetails.bookingRef,
      venueName: rejectionDetails.venueName,
      reason: rejectionDetails.reason,
    },
  );

  logger.info('[NotificationService] Sent payment rejected notification', {
    userId,
    bookingRef: rejectionDetails.bookingRef,
  });
}

// ── Get user notifications ────────────────────────────────────────────────────

export async function getUserNotifications(
  userId: string,
  page: number = 1,
  limit: number = 20,
  type?: string,
): Promise<{
  data: Notification[];
  pagination: { page: number; limit: number; total: number };
}> {
  const offset = (page - 1) * limit;

  const where: any = { userId };
  if (type) where.type = type;

  const { count, rows } = await Notification.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
  });

  return {
    data: rows,
    pagination: { page, limit, total: count },
  };
}

// ── Mark notification as read ─────────────────────────────────────────────────

export async function markAsRead(notificationId: string): Promise<void> {
  await Notification.update(
    { isRead: true },
    { where: { id: notificationId } },
  );
}

// ── Mark all as read ──────────────────────────────────────────────────────────

export async function markAllAsRead(userId: string): Promise<void> {
  await Notification.update(
    { isRead: true },
    { where: { userId } },
  );
}
