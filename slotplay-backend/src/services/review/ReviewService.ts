/**
 * services/review/ReviewService.ts
 *
 * Review management logic.
 */





import { Review, Venue, User, Booking } from '@/models';
import { AppError } from '@/utils/AppError';
import { logger } from '@/config/logger';
import type { SubmitReviewInput, ListReviewsInput } from '@/validators/review.validators';

// ── Submit or update a review ─────────────────────────────────────────────────

export async function submitReview(userId: string, input: SubmitReviewInput): Promise<any> {
  const { venueId, rating, comment } = input;

  // Verify venue exists
  const venue = await Venue.findByPk(venueId);
  if (!venue) throw AppError.notFound('Venue');

  // Verify user has a completed booking at this venue
  const booking = await Booking.findOne({
    where: {
      userId,
      venueId,
      status: 'confirmed', // Only allow reviews on confirmed bookings
    },
  });

  if (!booking) {
    throw new AppError(
      'You can only review venues where you have a confirmed booking',
      403,
      'NO_BOOKING',
    );
  }

  // Check if user already reviewed this venue
  const existing = await Review.findOne({
    where: {
      userId,
      venueId,
    },
  });

  if (existing) {
    // Update existing review
    await existing.update({
      rating,
      comment: comment || null,
    });
    logger.info('[ReviewService] Updated review', { reviewId: existing.id, venueId });
    return existing;
  }

  // Create new review
  const review = await Review.create({
    userId,
    venueId,
    rating,
    comment: comment || null,
  });

  logger.info('[ReviewService] Created review', { reviewId: review.id, venueId, userId });
  return review;
}

// ── Get reviews for a venue ───────────────────────────────────────────────────

export async function getReviewsForVenue(
  input: ListReviewsInput,
): Promise<{
  data: any[];
  pagination: { page: number; limit: number; total: number };
}> {
  const { venueId, page, limit, sortBy } = input;
  const offset = (page - 1) * limit;

  // Verify venue exists
  const venue = await Venue.findByPk(venueId);
  if (!venue) throw AppError.notFound('Venue');

  // Build sort order
  let order: any[] = [];
  switch (sortBy) {
    case 'recent':
      order = [['createdAt', 'DESC']];
      break;
    case 'rating-high':
      order = [['rating', 'DESC']];
      break;
    case 'rating-low':
      order = [['rating', 'ASC']];
      break;
  }

  // Fetch reviews with pagination
  const { count, rows } = await Review.findAndCountAll({
    where: { venueId },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'avatarUrl'],
      },
    ],
    order,
    limit,
    offset,
  });

  logger.debug('[ReviewService] Fetched reviews', { venueId, page, limit, total: count });

  return {
    data: rows.map((r) => r.toJSON()),
    pagination: {
      page,
      limit,
      total: count,
    },
  };
}

// ── Get average rating for a venue ────────────────────────────────────────────

export async function getAverageRating(venueId: string): Promise<number | null> {
  const reviews = await Review.findAll({
    where: { venueId },
    attributes: ['rating'],
    raw: true,
  });

  if (reviews.length === 0) return null;

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return parseFloat((sum / reviews.length).toFixed(1));
}
