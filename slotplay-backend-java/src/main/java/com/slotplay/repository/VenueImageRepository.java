package com.slotplay.repository;

import com.slotplay.entity.VenueImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VenueImageRepository extends JpaRepository<VenueImage, UUID> {
    List<VenueImage> findByVenueIdOrderByIsPrimaryDescSortOrderAsc(UUID venueId);
    List<VenueImage> findByVenueIdInOrderByIsPrimaryDescSortOrderAsc(java.util.Collection<UUID> venueIds);
}
