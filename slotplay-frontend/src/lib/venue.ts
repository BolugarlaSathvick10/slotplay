/**
 * lib/venue.ts
 *
 * Venue API client calls.
 */

import api from './api';
import { ApiSuccess, Venue, Review } from '@/types';

export interface ListVenuesParams {
  page?: number;
  limit?: number;
  sportId?: number;
  city?: string;
  search?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  sortBy?: 'rating' | 'distance' | 'price' | 'newest';
}

export interface SlotResponse {
  id: string;
  startTime: string;
  endTime: string;
  pricePerHour: number;
  isAvailable: boolean;
  bookingStatus: string | null;
}

export interface ReviewSubmit {
  venueId: string;
  rating: number;
  comment?: string;
}

// ── Venue queries ─────────────────────────────────────────────────────────────

export async function listVenues(params: ListVenuesParams) {
  const { data } = await api.get<ApiSuccess<{
    data: Venue[];
    pagination: { page: number; limit: number; total: number; pages: number };
  }>>('/api/venues', { params });
  return data.data;
}

export async function getVenue(id: string) {
  const { data } = await api.get<ApiSuccess<Venue>>(`/api/venues/${id}`);
  return data.data;
}

export async function getVenueSlots(id: string, date: Date) {
  const { data } = await api.get<ApiSuccess<SlotResponse[]>>(
    `/api/venues/${id}/slots`,
    { params: { date: date.toISOString().split('T')[0] } }
  );
  return data.data;
}

export async function getSports() {
  const { data } = await api.get('/api/venues/lists/sports');
  return data.data;
}

export async function getAmenities() {
  const { data } = await api.get('/api/venues/lists/amenities');
  return data.data;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function getVenueReviews(
  venueId: string,
  page: number = 1,
  limit: number = 10,
  sortBy: 'recent' | 'rating-high' | 'rating-low' = 'recent'
) {
  const { data } = await api.get<ApiSuccess<{
    data: Review[];
    pagination: { page: number; limit: number; total: number };
  }>>(`/api/venues/${venueId}/reviews`, {
    params: { page, limit, sortBy }
  });
  return data.data;
}

export async function submitReview(payload: ReviewSubmit) {
  const { data } = await api.post<ApiSuccess<Review>>('/api/venues/reviews', payload);
  return data.data;
}
