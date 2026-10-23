package com.slotplay.repository;

import com.slotplay.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    List<Review> findByVenueIdOrderByCreatedAtDesc(UUID venueId);

    List<Review> findByVenueIdIn(java.util.Collection<UUID> venueIds);

    Page<Review> findByVenueId(UUID venueId, Pageable pageable);

    Page<Review> findByVenueIdOrderByCreatedAtDesc(UUID venueId, Pageable pageable);

    Page<Review> findByVenueIdOrderByRatingDescCreatedAtDesc(UUID venueId, Pageable pageable);

    Page<Review> findByVenueIdOrderByRatingAscCreatedAtDesc(UUID venueId, Pageable pageable);

    Optional<Review> findFirstByUserIdAndVenueId(UUID userId, UUID venueId);

    Optional<Review> findByBookingId(UUID bookingId);
}
