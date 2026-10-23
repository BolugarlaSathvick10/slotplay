package com.slotplay.repository;

import com.slotplay.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {
    Optional<Payment> findByBookingId(UUID bookingId);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'verified'")
    java.math.BigDecimal sumVerifiedRevenue();

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'verified' AND p.booking.venue.owner.id = :ownerId")
    java.math.BigDecimal sumVerifiedRevenueByOwnerId(@org.springframework.data.repository.query.Param("ownerId") UUID ownerId);
}
