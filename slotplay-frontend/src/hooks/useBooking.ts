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

interface QueryOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export function useListBookings(page: number = 1, status?: string, options?: QueryOptions) {
  return useQuery({
    queryKey: ['bookings', page, status],
    queryFn: () => bookingApi.listBookings(page, 10, status),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useBookingDetail(bookingId: string | null, options?: QueryOptions) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => (bookingId ? bookingApi.getBooking(bookingId) : null),
    enabled: (options?.enabled ?? true) && !!bookingId,
    staleTime: 15 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
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
          ? 'Payment confirmed! Slot is booked and QR code generated.'
          : 'Payment rejected. User notified.'
      );
      queryClient.invalidateQueries({ queryKey: ['verifications'] });
      queryClient.invalidateQueries({ queryKey: ['owner-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['owner-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to verify payment');
    },
  });
}

export function usePendingVerifications(page: number = 1, options?: QueryOptions) {
  return useQuery({
    queryKey: ['verifications', page],
    queryFn: () => bookingApi.getPendingVerifications(page, 20),
    enabled: options?.enabled ?? true,
    staleTime: 15 * 1000,
    refetchInterval: options?.refetchInterval ?? 30_000,
  });
}

export function useOwnerBookings(page: number = 1, status?: string, options?: QueryOptions) {
  return useQuery({
    queryKey: ['owner-bookings', page, status],
    queryFn: () => bookingApi.getOwnerBookings(page, 20, status),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useOwnerStats(options?: QueryOptions) {
  return useQuery({
    queryKey: ['owner-stats'],
    queryFn: () => bookingApi.getOwnerStats(),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useAdminBookings(page: number = 1, status?: string, options?: QueryOptions) {
  return useQuery({
    queryKey: ['admin-bookings', page, status],
    queryFn: () => bookingApi.getAdminBookings(page, 20, status),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

export function useAdminPendingVerifications(page: number = 1, options?: QueryOptions) {
  return useQuery({
    queryKey: ['admin-verifications', page],
    queryFn: () => bookingApi.getAdminPendingVerifications(page, 20),
    enabled: options?.enabled ?? true,
    staleTime: 15 * 1000,
    refetchInterval: options?.refetchInterval ?? 30_000,
  });
}

export function useAdminStats(options?: QueryOptions) {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => bookingApi.getAdminStats(),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000,
    refetchInterval: options?.refetchInterval ?? false,
  });
}

