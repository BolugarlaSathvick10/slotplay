package com.slotplay.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class VerifyPaymentRequest {

    private UUID bookingId;

    @NotNull(message = "approved field is required")
    private Boolean approved;

    private String rejectionReason;

    public VerifyPaymentRequest() {
    }

    public VerifyPaymentRequest(Boolean approved, String rejectionReason) {
        this.approved = approved;
        this.rejectionReason = rejectionReason;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }

    public Boolean getApproved() {
        return approved;
    }

    public void setApproved(Boolean approved) {
        this.approved = approved;
    }

    public String getRejectionReason() {
        return rejectionReason;
    }

    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }
}
