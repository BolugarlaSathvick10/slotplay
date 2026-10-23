package com.slotplay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public class BookingDetailResponse {

    private UUID id;
    private String bookingRef;
    private UUID userId;
    private UUID slotId;
    private UUID venueId;
    private BigDecimal totalAmount;
    private String status;
    private String qrCodeUrl;
    private QrTicketPayload qrTicket;
    private Instant confirmedAt;
    private Instant cancelledAt;
    private Instant createdAt;
    private Instant updatedAt;

    private VenueListItemResponse venue;
    private SlotItemResponse slot;
    private PaymentResponse payment;
    private PaymentVerificationResponse verification;
    private BookingUserSummary user;

    public BookingDetailResponse() {
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getBookingRef() {
        return bookingRef;
    }

    public void setBookingRef(String bookingRef) {
        this.bookingRef = bookingRef;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public UUID getSlotId() {
        return slotId;
    }

    public void setSlotId(UUID slotId) {
        this.slotId = slotId;
    }

    public UUID getVenueId() {
        return venueId;
    }

    public void setVenueId(UUID venueId) {
        this.venueId = venueId;
    }

    public BigDecimal getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(BigDecimal totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getQrCodeUrl() {
        return qrCodeUrl;
    }

    public void setQrCodeUrl(String qrCodeUrl) {
        this.qrCodeUrl = qrCodeUrl;
    }

    public QrTicketPayload getQrTicket() {
        return qrTicket;
    }

    public void setQrTicket(QrTicketPayload qrTicket) {
        this.qrTicket = qrTicket;
    }

    public Instant getConfirmedAt() {
        return confirmedAt;
    }

    public void setConfirmedAt(Instant confirmedAt) {
        this.confirmedAt = confirmedAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public VenueListItemResponse getVenue() {
        return venue;
    }

    public void setVenue(VenueListItemResponse venue) {
        this.venue = venue;
    }

    public SlotItemResponse getSlot() {
        return slot;
    }

    public void setSlot(SlotItemResponse slot) {
        this.slot = slot;
    }

    public PaymentResponse getPayment() {
        return payment;
    }

    public void setPayment(PaymentResponse payment) {
        this.payment = payment;
    }

    public PaymentVerificationResponse getVerification() {
        return verification;
    }

    public void setVerification(PaymentVerificationResponse verification) {
        this.verification = verification;
    }

    @JsonProperty("paymentVerification")
    public PaymentVerificationResponse getPaymentVerification() {
        return verification;
    }

    public BookingUserSummary getUser() {
        return user;
    }

    public void setUser(BookingUserSummary user) {
        this.user = user;
    }

    public static class BookingUserSummary {
        private UUID id;
        private String name;
        private String email;
        private String phone;

        public BookingUserSummary() {
        }

        public BookingUserSummary(UUID id, String name, String email, String phone) {
            this.id = id;
            this.name = name;
            this.email = email;
            this.phone = phone;
        }

        public UUID getId() {
            return id;
        }

        public void setId(UUID id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }
    }
}
