package com.slotplay.service.impl;

import com.slotplay.dto.PaginatedData;
import com.slotplay.dto.ReviewResponse;
import com.slotplay.dto.SubmitReviewRequest;
import com.slotplay.entity.Booking;
import com.slotplay.entity.Review;
import com.slotplay.entity.User;
import com.slotplay.entity.Venue;
import com.slotplay.exception.AppException;
import com.slotplay.repository.BookingRepository;
import com.slotplay.repository.ReviewRepository;
import com.slotplay.repository.UserRepository;
import com.slotplay.repository.VenueRepository;
import com.slotplay.service.ReviewService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final VenueRepository venueRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public ReviewServiceImpl(
            ReviewRepository reviewRepository,
            VenueRepository venueRepository,
            UserRepository userRepository,
            BookingRepository bookingRepository
    ) {
        this.reviewRepository = reviewRepository;
        this.venueRepository = venueRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public ReviewResponse submitReview(UUID userId, SubmitReviewRequest req) {
        if (req.getRating() == null || req.getRating() < 1 || req.getRating() > 5) {
            throw new AppException("Rating must be between 1 and 5", HttpStatus.BAD_REQUEST, "INVALID_RATING");
        }

        Venue venue = venueRepository.findById(req.getVenueId())
                .orElseThrow(() -> AppException.notFound("Venue"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User"));

        // User must have a confirmed booking at this venue
        List<Booking> confirmedBookings = bookingRepository.findByUserIdAndVenueIdAndStatus(userId, req.getVenueId(), "confirmed");
        if (confirmedBookings.isEmpty()) {
            throw new AppException(
                    "You can only review venues where you have a confirmed booking",
                    HttpStatus.FORBIDDEN,
                    "NO_BOOKING"
            );
        }

        // Check for existing review by this user on this venue
        Optional<Review> existingOpt = reviewRepository.findFirstByUserIdAndVenueId(userId, req.getVenueId());

        Review review;
        if (existingOpt.isPresent()) {
            review = existingOpt.get();
            review.setRating(req.getRating());
            review.setComment(req.getComment() != null ? req.getComment().trim() : null);
        } else {
            review = new Review(user, venue, req.getRating(), req.getComment() != null ? req.getComment().trim() : null);
            review.setBookingId(confirmedBookings.get(0).getId());
        }

        Review savedReview = reviewRepository.save(review);

        // Update venue rating statistics
        List<Review> allVenueReviews = reviewRepository.findByVenueIdOrderByCreatedAtDesc(venue.getId());
        if (!allVenueReviews.isEmpty()) {
            double avg = allVenueReviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
            venue.setTotalReviews(allVenueReviews.size());
            venue.setAvgRating(BigDecimal.valueOf(avg));
            venueRepository.save(venue);
        }

        return mapToResponse(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedData<ReviewResponse> getReviewsForVenue(UUID venueId, int page, int limit, String sortBy) {
        if (!venueRepository.existsById(venueId)) {
            throw AppException.notFound("Venue");
        }

        int safePage = Math.max(1, page);
        int safeLimit = Math.min(50, Math.max(1, limit));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);

        Page<Review> reviewPage;
        if ("rating-high".equalsIgnoreCase(sortBy)) {
            reviewPage = reviewRepository.findByVenueIdOrderByRatingDescCreatedAtDesc(venueId, pageable);
        } else if ("rating-low".equalsIgnoreCase(sortBy)) {
            reviewPage = reviewRepository.findByVenueIdOrderByRatingAscCreatedAtDesc(venueId, pageable);
        } else {
            reviewPage = reviewRepository.findByVenueIdOrderByCreatedAtDesc(venueId, pageable);
        }

        List<ReviewResponse> dtos = reviewPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new PaginatedData<>(
                dtos,
                safePage,
                safeLimit,
                reviewPage.getTotalElements(),
                reviewPage.getTotalPages()
        );
    }

    private ReviewResponse mapToResponse(Review r) {
        User u = r.getUser();
        ReviewResponse.UserSummary summary = (u != null)
                ? new ReviewResponse.UserSummary(u.getId().toString(), u.getName(), u.getAvatarUrl())
                : null;

        return new ReviewResponse(
                r.getId().toString(),
                r.getRating(),
                r.getComment(),
                r.getCreatedAt(),
                summary
        );
    }
}
