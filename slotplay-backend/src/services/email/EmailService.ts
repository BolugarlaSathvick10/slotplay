/**
 * services/email/EmailService.ts
 *
 * All transactional emails sent via Resend.
 * Uses typed template functions from ./templates.ts
 */

import { Resend } from 'resend';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import {
  welcomeTemplate,
  verificationTemplate,
  passwordResetTemplate,
  bookingConfirmationTemplate,
  paymentSubmittedOwnerTemplate,
  paymentApprovedTemplate,
  paymentRejectedTemplate,
  bookingCancelledTemplate,
} from './templates';

const resend = new Resend(env.RESEND_API_KEY);

interface SendResult { success: boolean; messageId?: string; error?: string; }

async function send(to: string, subject: string, html: string): Promise<SendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
    });
    if (error) { logger.error('[Email] Resend error', { to, subject, error }); return { success: false, error: error.message }; }
    logger.info('[Email] Sent', { to, subject, messageId: data?.id });
    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('[Email] Error', { to, subject, error: message });
    return { success: false, error: message };
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export const sendWelcomeEmail = (to: string, name: string) =>
  send(to, 'Welcome to SlotPlay — Reserve Your Game 🎉', welcomeTemplate(name));

export const sendVerificationEmail = (to: string, name: string, otp: string) =>
  send(to, `${otp} is your SlotPlay verification code`, verificationTemplate(name, otp));

export const sendPasswordResetEmail = (to: string, name: string, otp: string) =>
  send(to, `Reset your SlotPlay password`, passwordResetTemplate(name, otp));

export const sendBookingConfirmationEmail = (
  to: string, name: string,
  d: { bookingRef: string; venueName: string; address: string; date: string; startTime: string; endTime: string; amount: number; upiId?: string },
) => send(to, `Booking confirmed — ${d.venueName} on ${d.date}`, bookingConfirmationTemplate(name, d));

export const sendPaymentSubmittedNotificationEmail = (
  to: string, ownerName: string,
  d: { bookingRef: string; userName: string; userEmail: string; venueName: string; amount: number; utrNumber: string },
) => send(to, `New payment to verify — ${d.bookingRef}`, paymentSubmittedOwnerTemplate(ownerName, d));

export const sendPaymentApprovedEmail = (
  to: string, name: string,
  d: { bookingRef: string; venueName: string; date: string; startTime: string; endTime: string; amount: number },
) => send(to, `✅ Payment verified — you're in at ${d.venueName}!`, paymentApprovedTemplate(name, d));

export const sendPaymentRejectedEmail = (
  to: string, name: string,
  d: { bookingRef: string; venueName: string; reason?: string },
) => send(to, `Payment not verified — ${d.bookingRef}`, paymentRejectedTemplate(name, d));

export const sendBookingCancelledEmail = (
  to: string, name: string,
  d: { bookingRef: string; venueName: string; date: string },
) => send(to, `Booking cancelled — ${d.bookingRef}`, bookingCancelledTemplate(name, d));
