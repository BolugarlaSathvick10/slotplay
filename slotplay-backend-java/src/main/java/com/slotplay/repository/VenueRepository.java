package com.slotplay.repository;

import com.slotplay.entity.Venue;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VenueRepository extends JpaRepository<Venue, UUID> {

    List<Venue> findByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    List<Venue> findByStatus(String status);

    @Query("SELECT DISTINCT v FROM Venue v LEFT JOIN FETCH v.sport LEFT JOIN FETCH v.amenities WHERE v.status = :status")
    List<Venue> findActiveWithSportAndAmenities(@Param("status") String status);

    long countByOwnerId(UUID ownerId);

    long countByStatus(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT v FROM Venue v WHERE v.id = :id")
    Optional<Venue> findByIdForUpdate(@Param("id") UUID id);
}
