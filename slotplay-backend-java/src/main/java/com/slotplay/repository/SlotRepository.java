package com.slotplay.repository;

import com.slotplay.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SlotRepository extends JpaRepository<Slot, UUID> {

    List<Slot> findByVenueIdAndDateOrderByStartTimeAsc(UUID venueId, LocalDate date);

    long countByVenueIdAndDate(UUID venueId, LocalDate date);

    Optional<Slot> findByVenueIdAndDateAndStartTime(UUID venueId, LocalDate date, LocalTime startTime);

    List<Slot> findByVenueIdAndDateBetweenOrderByDateAscStartTimeAsc(UUID venueId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT s FROM Slot s WHERE s.venue.id = :venueId AND s.date = :date AND s.startTime < :endTime AND s.endTime > :startTime")
    List<Slot> findOverlappingSlots(
            @Param("venueId") UUID venueId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM Slot s WHERE s.id = :id")
    Optional<Slot> findByIdForUpdate(@Param("id") UUID id);
}
