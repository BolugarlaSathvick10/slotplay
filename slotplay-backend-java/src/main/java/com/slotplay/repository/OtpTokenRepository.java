package com.slotplay.repository;

import com.slotplay.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, UUID> {

    Optional<OtpToken> findTopByUserIdAndOtpCodeAndPurposeAndIsUsedFalseAndExpiresAtAfter(
            UUID userId, String otpCode, String purpose, Instant now
    );

    Optional<OtpToken> findTopByUserEmailIgnoreCaseAndOtpCodeAndPurposeAndIsUsedFalseAndExpiresAtAfter(
            String email, String otpCode, String purpose, Instant now
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE OtpToken o SET o.isUsed = true WHERE o.user.id = :userId AND o.purpose = :purpose AND o.isUsed = false")
    void invalidatePreviousOtps(@Param("userId") UUID userId, @Param("purpose") String purpose);

    Optional<OtpToken> findTopByUserIdAndOtpCodeAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(
            UUID userId, String otpCode, String purpose
    );
}
