package com.slotplay.repository;

import com.slotplay.entity.PaymentVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentVerificationRepository extends JpaRepository<PaymentVerification, UUID> {
    Optional<PaymentVerification> findFirstByBookingIdOrderByCreatedAtDesc(UUID bookingId);
}
