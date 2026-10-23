package com.slotplay.repository;

import com.slotplay.entity.OwnerUpiQr;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OwnerUpiQrRepository extends JpaRepository<OwnerUpiQr, UUID> {
    Optional<OwnerUpiQr> findFirstByVenueIdAndIsActiveTrue(UUID venueId);
    Optional<OwnerUpiQr> findFirstByOwnerIdAndIsActiveTrue(UUID ownerId);
}
