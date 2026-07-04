/**
 * routes/venue.routes.ts
 */

import { Router } from 'express';
import * as venueController from '@/controllers/venue.controller';
import * as reviewController from '@/controllers/review.controller';
import { validate } from '@/middleware/validate';
import { requireAuth } from '@/middleware/auth';
import {
  listVenuesSchema,
  createVenueSchema,
  updateVenueSchema,
} from '@/validators/venue.validators';
import {
  submitReviewSchema,
} from '@/validators/review.validators';

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────

/** List venues with optional filters */
router.get('/', validate(listVenuesSchema), venueController.listVenues);

/** Get single venue detail */
router.get('/:id', venueController.getVenue);

/** Get available slots for a date */
router.get('/:id/slots', venueController.getSlots);

/** Get reviews for a venue */
router.get('/:venueId/reviews', reviewController.listReviews);

// ── Authenticated routes ───────────────────────────────────────────────────────

/** Create venue (owner only) */
router.post(
  '/',
  requireAuth,
  validate(createVenueSchema),
  venueController.createVenue,
);

/** Update venue (owner only) */
router.put(
  '/:id',
  requireAuth,
  validate(updateVenueSchema),
  venueController.updateVenue,
);

/** Submit/update review */
router.post(
  '/reviews',
  requireAuth,
  validate(submitReviewSchema),
  reviewController.submitReview,
);

// ── Dropdown/lookup routes ────────────────────────────────────────────────────

/** List all sports (for filtering and venue creation) */
router.get('/lists/sports', venueController.getSports);

/** List all amenities (for venue creation and detail display) */
router.get('/lists/amenities', venueController.getAmenities);

export { router as venueRouter };
