package com.slotplay.controller;

import com.slotplay.dto.ApiResponse;
import com.slotplay.dto.PaginatedData;
import com.slotplay.dto.ReviewResponse;
import com.slotplay.dto.SubmitReviewRequest;
import com.slotplay.security.UserPrincipal;
import com.slotplay.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    @PostMapping({"/api/venues/reviews", "/api/reviews"})
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<ReviewResponse>> submitReview(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitReviewRequest req
    ) {
        ReviewResponse response = reviewService.submitReview(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Review submitted successfully"));
    }

    @GetMapping("/api/venues/{venueId}/reviews")
    public ResponseEntity<ApiResponse<PaginatedData<ReviewResponse>>> getVenueReviews(
            @PathVariable("venueId") UUID venueId,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "sortBy", defaultValue = "recent") String sortBy
    ) {
        PaginatedData<ReviewResponse> result = reviewService.getReviewsForVenue(venueId, page, limit, sortBy);
        return ResponseEntity.ok(ApiResponse.success(result, "Reviews retrieved successfully"));
    }
}
