package com.slotplay.repository;

import com.slotplay.entity.OwnerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OwnerProfileRepository extends JpaRepository<OwnerProfile, UUID> {
    Optional<OwnerProfile> findByUserId(UUID userId);
}
