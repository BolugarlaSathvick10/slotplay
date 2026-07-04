/**
 * lib/booking.ts
 *
 * Booking API client calls.
 */

import api from './api';
import { ApiSuccess, Booking } from '@/types';

export interface CreateBookingPayload {
  slotId: string;
  venueId: string;
}

export interface SubmitPaymentPayload {
  bookingId: string;
  utrNumber: string;
  screenshot: File;
}

export interface VerifyPaymentPayload {
  bookingId: string;
  approved: boolean;
  rejectionReason?: string;
}

// ── Create booking ────────────────────────────────────────────────────────────

export async function createBooking(payload: CreateBookingPayload) {
  const { data } = await api.post<ApiSuccess<Booking>>(
    '/api/bookings',
    payload
  );
  return data.data;
}

// ── Submit payment ────────────────────────────────────────────────────────────

export async function submitPayment(payload: SubmitPaymentPayload) {
  const formData = new FormData();
  formData.append('utrNumber', payload.utrNumber);
  formData.append('screenshot', payload.screenshot);

  const { data } = await api.post<ApiSuccess>(
    `/api/bookings/${payload.bookingId}/payment`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return data.data;
}

// ── List user's bookings ──────────────────────────────────────────────────────

export async function listBookings(
  page: number = 1,
  limit: number = 10,
  status?: string
) {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) params.append('status', status);

  const { data } = await api.get<ApiSuccess<{
    data: Booking[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>>(`/api/bookings?${params.toString()}`);
  
  return data.data;
}

// ── Get booking detail ────────────────────────────────────────────────────────

export async function getBooking(bookingId: string) {
  const { data } = await api.get<ApiSuccess<Booking>>(
    `/api/bookings/${bookingId}`
  );
  return data.data;
}

// ── Cancel booking ────────────────────────────────────────────────────────────

export async function cancelBooking(bookingId: string) {
  const { data } = await api.delete<ApiSuccess>(
    `/api/bookings/${bookingId}`
  );
  return data;
}

// ── Verify payment (owner) ────────────────────────────────────────────────────

export async function verifyPayment(payload: VerifyPaymentPayload) {
  const { data } = await api.post<ApiSuccess>(
    `/api/bookings/${payload.bookingId}/verify`,
    {
      approved: payload.approved,
      rejectionReason: payload.rejectionReason,
    }
  );
  return data;
}

// ── Get pending verifications (owner) ──────────────────────────────────────────

export async function getPendingVerifications(page: number = 1, limit: number = 20) {
  const { data } = await api.get<ApiSuccess<{
    data: any[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>>(`/api/owner/verifications?page=${page}&limit=${limit}`);
  
  return data.data;
}
