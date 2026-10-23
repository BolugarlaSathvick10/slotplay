package com.slotplay.dto;

import java.time.Instant;
import java.util.UUID;

public class PaymentVerificationResponse {

    private UUID id;
    private UUID paymentId;
    private UUID bookingId;
    private UUID submittedBy;
    private String utrNumber;
    private String screenshotUrl;
    private String screenshotKey;
    private String status;
    private String reviewNote;
    private Instant submittedAt;
    private Instant reviewedAt;

    public PaymentVerificationResponse() {
    }

    public PaymentVerificationResponse(UUID id, UUID paymentId, UUID bookingId, UUID submittedBy,
                                       String utrNumber, String screenshotUrl, String screenshotKey,
                                       String status, String reviewNote, Instant submittedAt, Instant reviewedAt) {
        this.id = id;
        this.paymentId = paymentId;
        this.bookingId = bookingId;
        this.submittedBy = submittedBy;
        this.utrNumber = utrNumber;
        this.screenshotUrl = screenshotUrl;
        this.screenshotKey = screenshotKey;
        this.status = status;
        this.reviewNote = reviewNote;
        this.submittedAt = submittedAt;
        this.reviewedAt = reviewedAt;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(UUID paymentId) {
        this.paymentId = paymentId;
    }

    public UUID getBookingId() {
        return bookingId;
    }

    public void setBookingId(UUID bookingId) {
        this.bookingId = bookingId;
    }

    public UUID getSubmittedBy() {
        return submittedBy;
    }

    public void setSubmittedBy(UUID submittedBy) {
        this.submittedBy = submittedBy;
    }

    public String getUtrNumber() {
        return utrNumber;
    }

    public void setUtrNumber(String utrNumber) {
        this.utrNumber = utrNumber;
    }

    public String getScreenshotUrl() {
        return screenshotUrl;
    }

    public void setScreenshotUrl(String screenshotUrl) {
        this.screenshotUrl = screenshotUrl;
    }

    public String getScreenshotKey() {
        return screenshotKey;
    }

    public void setScreenshotKey(String screenshotKey) {
        this.screenshotKey = screenshotKey;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getReviewNote() {
        return reviewNote;
    }

    public void setReviewNote(String reviewNote) {
        this.reviewNote = reviewNote;
    }

    public Instant getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(Instant submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
