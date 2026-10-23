package com.slotplay.service;

import java.math.BigDecimal;

public interface EmailService {

    void sendVerificationEmail(String email, String name, String otpCode);

    void sendPasswordResetEmail(String email, String name, String otpCode);

    void sendBookingConfirmationEmail(String to, String name, String bookingRef, String venueName, String address, String date, String startTime, String endTime, BigDecimal amount);

    void sendPaymentSubmittedNotificationEmail(String to, String ownerName, String bookingRef, String userName, String userEmail, String venueName, BigDecimal amount, String utrNumber);

    void sendPaymentApprovedEmail(String to, String name, String bookingRef, String venueName, String date, String startTime, String endTime, BigDecimal amount);

    void sendPaymentRejectedEmail(String to, String name, String bookingRef, String venueName, String reason);

    void sendBookingCancelledEmail(String to, String name, String bookingRef, String venueName, String date);
}
