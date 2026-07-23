/**
 * services/review/ReviewService.ts
 *
 * Review management logic.
 */

import { Review, Venue, User, Booking } from '@/models';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';
import { BookingStatus } from '@/types';
import type { SubmitReviewInput, ListReviewsInput } from '@/validators/review.validators';

// ── Submit or update a review ─────────────────────────────────────────────────

export async function submitReview(userId: string, input: SubmitReviewInput): Promise<any> {
  const { venueId, rating, comment } = input;

  const venue = await Venue.findByPk(venueId);
  if (!venue) throw AppError.notFound('Venue');

  // User must have a confirmed booking at this venue
  const booking = await Booking.findOne({
    where: { userId, venueId, status: BookingStatus.CONFIRMED },
  });

  if (!booking) {
    throw new AppError(
      'You can only review venues where you have a confirmed booking',
      403,
      'NO_BOOKING',
    );
  }

  // Check for existing review on this booking
  const existing = await Review.findOne({ where: { bookingId: booking.id } });

  if (existing) {
    await existing.update({ rating, comment: comment ?? null });
    logger.info('[ReviewService] Updated review', { reviewId: existing.id, venueId });
    return existing;
  }

  // Create new review — bookingId is required by ReviewAttributes
  const review = await Review.create({
    userId,
    venueId,
    bookingId: booking.id,
    rating,
    comment: comment ?? null,
  });

  logger.info('[ReviewService] Created review', { reviewId: review.id, venueId, userId });
  return review;
}

// ── Get reviews for a venue ───────────────────────────────────────────────────

export async function getReviewsForVenue(
  input: ListReviewsInput,
): Promise<{ data: any[]; pagination: { page: number; limit: number; total: number } }> {
  const { venueId, page, limit, sortBy } = input;
  const offset = (page - 1) * limit;

  const venue = await Venue.findByPk(venueId);
  if (!venue) throw AppError.notFound('Venue');

  const order: any[] =
    sortBy === 'rating-high' ? [['rating', 'DESC']] :
    sortBy === 'rating-low'  ? [['rating', 'ASC']]  :
    [['createdAt', 'DESC']];

  const { count, rows } = await Review.findAndCountAll({
    where: { venueId },
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'avatarUrl'] }],
    order,
    limit,
    offset,
  });

  logger.debug('[ReviewService] Fetched reviews', { venueId, page, limit, total: count });

  return {
    data: rows.map(r => r.toJSON()),
    pagination: { page, limit, total: count },
  };
}

// ── Get average rating for a venue ────────────────────────────────────────────

export async function getAverageRating(venueId: string): Promise<number | null> {
  const reviews = await Review.findAll({ where: { venueId }, attributes: ['rating'], raw: true });
  if (reviews.length === 0) return null;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return parseFloat((sum / reviews.length).toFixed(1));
}
