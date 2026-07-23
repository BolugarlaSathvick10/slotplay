/**
 * hooks/useBooking.ts
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as bookingApi from '@/lib/booking';
import toast from 'react-hot-toast';

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingApi.createBooking,
    onSuccess: (booking) => {
      toast.success(`Booking created! Reference: ${booking.bookingRef}`);
      // Invalidate bookings list
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create booking');
    },
  });
}

export function useSubmitPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingApi.submitPayment,
    onSuccess: () => {
      toast.success('Payment submitted! Waiting for verification.');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit payment');
    },
  });
}

export function useListBookings(page: number = 1, status?: string) {
  return useQuery({
    queryKey: ['bookings', page, status],
    queryFn: () => bookingApi.listBookings(page, 10, status),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useBookingDetail(bookingId: string | null) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => (bookingId ? bookingApi.getBooking(bookingId) : null),
    enabled: !!bookingId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingApi.cancelBooking,
    onSuccess: () => {
      toast.success('Booking cancelled');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to cancel booking');
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingApi.verifyPayment,
    onSuccess: (data, variables) => {
      toast.success(
        variables.approved
          ? 'Payment verified!'
          : 'Payment rejected. User notified.'
      );
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to verify payment');
    },
  });
}

export function usePendingVerifications(page: number = 1) {
  return useQuery({
    queryKey: ['verifications', page],
    queryFn: () => bookingApi.getPendingVerifications(page, 20),
    staleTime: 30 * 1000, // 30 seconds — owner wants real-time updates
  });
}
