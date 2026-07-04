/**
 * lib/utils.ts
 *
 * Shared frontend utilities.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names safely — resolves conflicting utilities */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format a price in INR */
export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format an ISO date string to a readable format e.g. "Mon, 2 Jun 2025" */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Format HH:MM time string to 12-hour format e.g. "06:00" → "6:00 AM" */
export function formatTime(time: string): string {
  const [hourStr, minStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minStr ?? '00';
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minute} ${period}`;
}

/** Return the booking status label for display */
export function bookingStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending_payment: 'Awaiting Payment',
    pending_verification: 'Verification Pending',
    confirmed: 'Confirmed',
    rejected: 'Payment Rejected',
    cancelled: 'Cancelled',
  };
  return labels[status] ?? status;
}
