/**
 * validators/review.validators.ts
 */

import { z } from 'zod';

// ── Submit Review ─────────────────────────────────────────────────────────────

export const submitReviewSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  rating: z.coerce.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().min(5).max(500).optional().or(z.literal('')),
});

// ── List Reviews for Venue ────────────────────────────────────────────────────

export const listReviewsSchema = z.object({
  venueId: z.string().uuid('Invalid venue ID'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sortBy: z.enum(['recent', 'rating-high', 'rating-low']).default('recent'),
});

// ── Type exports ──────────────────────────────────────────────────────────────

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type ListReviewsInput = z.infer<typeof listReviewsSchema>;
