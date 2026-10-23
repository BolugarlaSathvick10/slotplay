package com.slotplay.service;

import com.slotplay.dto.PaginatedData;
import com.slotplay.dto.ReviewResponse;
import com.slotplay.dto.SubmitReviewRequest;

import java.util.UUID;

public interface ReviewService {

    ReviewResponse submitReview(UUID userId, SubmitReviewRequest req);

    PaginatedData<ReviewResponse> getReviewsForVenue(UUID venueId, int page, int limit, String sortBy);
}
