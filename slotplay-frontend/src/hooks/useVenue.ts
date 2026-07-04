/**
 * hooks/useVenue.ts
 */

'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import * as venueApi from '@/lib/venue';
import toast from 'react-hot-toast';

export function useVenueList(params?: venueApi.ListVenuesParams) {
  return useQuery({
    queryKey: ['venues', params],
    queryFn: () => venueApi.listVenues(params || {}),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useVenueDetail(venueId: string | null) {
  return useQuery({
    queryKey: ['venue', venueId],
    queryFn: () => (venueId ? venueApi.getVenue(venueId) : null),
    enabled: !!venueId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useVenueSlots(venueId: string | null, date: Date | null) {
  return useQuery({
    queryKey: ['venue-slots', venueId, date?.toISOString().split('T')[0]],
    queryFn: () =>
      venueId && date ? venueApi.getVenueSlots(venueId, date) : null,
    enabled: !!venueId && !!date,
    staleTime: 2 * 60 * 1000, // 2 minutes (slots update frequently)
  });
}

export function useSports() {
  return useQuery({
    queryKey: ['sports'],
    queryFn: venueApi.getSports,
    staleTime: Infinity, // Sports don't change
  });
}

export function useAmenities() {
  return useQuery({
    queryKey: ['amenities'],
    queryFn: venueApi.getAmenities,
    staleTime: Infinity,
  });
}

export function useVenueReviews(venueId: string | null, page: number = 1) {
  return useQuery({
    queryKey: ['venue-reviews', venueId, page],
    queryFn: () =>
      venueId ? venueApi.getVenueReviews(venueId, page) : null,
    enabled: !!venueId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useSubmitReview() {
  const { isAuthenticated } = useAuth();

  return useMutation({
    mutationFn: async (payload: venueApi.ReviewSubmit) => {
      if (!isAuthenticated) {
        throw new Error('You must be logged in to submit a review');
      }
      return venueApi.submitReview(payload);
    },
    onSuccess: () => {
      toast.success('Review submitted successfully!');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to submit review');
    },
  });
}
