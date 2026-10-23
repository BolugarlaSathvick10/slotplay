package com.slotplay.repository;

import com.slotplay.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface BookingRepository extends JpaRepository<Booking, UUID> {

    boolean existsBySlotIdAndStatusIn(UUID slotId, Collection<String> statuses);

    List<Booking> findBySlotIdInAndStatusIn(Collection<UUID> slotIds, Collection<String> statuses);

    Optional<Booking> findTopBySlotIdAndStatusInOrderByCreatedAtDesc(UUID slotId, Collection<String> statuses);

    Optional<Booking> findByBookingRef(String bookingRef);

    Page<Booking> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    Page<Booking> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, String status, Pageable pageable);

    Page<Booking> findByVenueOwnerIdOrderByCreatedAtDesc(UUID ownerId, Pageable pageable);

    Page<Booking> findByVenueOwnerIdAndStatusOrderByCreatedAtDesc(UUID ownerId, String status, Pageable pageable);

    Page<Booking> findByVenueOwnerIdAndStatusInOrderByCreatedAtDesc(UUID ownerId, Collection<String> statuses, Pageable pageable);

    long countByVenueOwnerId(UUID ownerId);

    long countByVenueOwnerIdAndStatus(UUID ownerId, String status);

    long countByVenueOwnerIdAndStatusIn(UUID ownerId, Collection<String> statuses);

    Page<Booking> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Booking> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    Page<Booking> findByStatusInOrderByCreatedAtDesc(Collection<String> statuses, Pageable pageable);

    long countByStatus(String status);

    long countByStatusIn(Collection<String> statuses);

    List<Booking> findByUserIdAndVenueIdAndStatus(UUID userId, UUID venueId, String status);
}
