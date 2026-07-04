/**
 * validators/venue.validators.ts
 *
 * Zod validation schemas for venue endpoints.
 */

import { z } from 'zod';

// ── List/Filter Venues ────────────────────────────────────────────────────────

export const listVenuesSchema = z.object({
  // Query parameters
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sportId: z.coerce.number().int().positive().optional(),
  city: z.string().trim().min(2).max(50).optional(),
  search: z.string().trim().max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(0.5).max(50).default(10),
  sortBy: z.enum(['rating', 'distance', 'price', 'newest']).default('rating'),
});

// ── Get Venue Detail ──────────────────────────────────────────────────────────

export const getVenueSchema = z.object({
  id: z.string().uuid('Invalid venue ID'),
});

// ── Get Slots for a Date ──────────────────────────────────────────────────────

export const getSlotsSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  date: z.coerce.date(),
  sportId: z.coerce.number().int().positive().optional(),
});

// ── Create Venue (Owner) ──────────────────────────────────────────────────────

export const createVenueSchema = z.object({
  name: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  sportIds: z.array(z.number().int().positive()).min(1, 'Select at least one sport'),
  address: z.string().trim().min(5).max(200),
  city: z.string().trim().min(2).max(50),
  state: z.string().trim().min(2).max(50),
  pincode: z.string().regex(/^\d{6}$/, 'Invalid 6-digit pincode'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  amenityIds: z.array(z.number().int().positive()).optional(),
  pricePerHour: z.coerce.number().min(100).max(100000),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
});

// ── Update Venue (Owner) ──────────────────────────────────────────────────────

export const updateVenueSchema = z.object({
  name: z.string().trim().min(3).max(120).optional(),
  description: z.string().trim().max(1000).optional(),
  sportIds: z.array(z.number().int().positive()).optional(),
  amenityIds: z.array(z.number().int().positive()).optional(),
  pricePerHour: z.coerce.number().min(100).max(100000).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  isActive: z.boolean().optional(),
});

// ── Type exports ──────────────────────────────────────────────────────────────

export type ListVenuesInput = z.infer<typeof listVenuesSchema>;
export type GetVenueInput = z.infer<typeof getVenueSchema>;
export type GetSlotsInput = z.infer<typeof getSlotsSchema>;
export type CreateVenueInput = z.infer<typeof createVenueSchema>;
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;
