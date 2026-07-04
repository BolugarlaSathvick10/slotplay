/**
 * controllers/review.controller.ts
 */

import { Request, Response, NextFunction } from 'express';
import * as ReviewService from '@/services/review/ReviewService';
import { sendSuccess, sendPaginated } from '@/utils/apiResponse';
import { asyncHandler } from '@/utils/helpers';

// ── POST /api/reviews (submit review) ──────────────────────────────────────────

export const submitReview = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const review = await ReviewService.submitReview(
      req.session.userId!,
      req.body,
    );

    sendSuccess(
      res,
      review,
      'Review submitted successfully',
      201,
    );
  },
);

// ── GET /api/venues/:venueId/reviews (list reviews) ────────────────────────

export const listReviews = asyncHandler(
  async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { venueId } = req.params;

    const result = await ReviewService.getReviewsForVenue({
      venueId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      sortBy: (req.query.sortBy as 'recent' | 'rating-high' | 'rating-low') || 'recent',
    });

    sendPaginated(
      res,
      result.data,
      { ...result.pagination, pages: Math.ceil(result.pagination.total / result.pagination.limit) },
      'Reviews retrieved successfully',
    );
  },
);
