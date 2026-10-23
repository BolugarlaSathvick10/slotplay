package com.slotplay.service.impl;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.slotplay.config.DataSourceConfig;
import com.slotplay.exception.EmailDeliveryException;
import com.slotplay.service.EmailService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.math.BigDecimal;
import java.util.List;

/**
 * Implementation of EmailService integrating with the Resend HTTP API.
 * Automatically active when RESEND_API_KEY is configured.
 * Sanitizes all logs to prevent leaking secrets, OTPs, or sensitive user details.
 */
@Service
public class DefaultEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(DefaultEmailService.class);
    private static final String DEFAULT_RESEND_URL = "https://api.resend.com";

    private final RestClient restClient;

    @Autowired(required = false)
    private Environment environment;

    private Boolean forceProduction;

    @Value("${slotplay.resend.api-key:${RESEND_API_KEY:}}")
    private String resendApiKey;
    private boolean apiKeyExplicitlySet = false;

    @Value("${slotplay.mail.from:${EMAIL_FROM:${RESEND_FROM_EMAIL:SlotPlay <slotplay@nmart.me>}}}")
    private String emailFrom = "SlotPlay <slotplay@nmart.me>";
    private boolean emailFromExplicitlySet = false;

    public DefaultEmailService() {
        this(RestClient.builder().baseUrl(DEFAULT_RESEND_URL).build(), null);
    }

    public DefaultEmailService(RestClient restClient) {
        this(restClient, null);
    }

    public DefaultEmailService(RestClient restClient, Environment environment) {
        this.restClient = restClient;
        this.environment = environment;
    }

    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    public void setForceProduction(Boolean forceProduction) {
        this.forceProduction = forceProduction;
    }

    public boolean isProduction() {
        if (Boolean.TRUE.equals(forceProduction)) {
            return true;
        }
        if (Boolean.FALSE.equals(forceProduction)) {
            return false;
        }
        if (environment != null && environment.getActiveProfiles() != null) {
            for (String profile : environment.getActiveProfiles()) {
                if ("prod".equalsIgnoreCase(profile) || "production".equalsIgnoreCase(profile)) {
                    return true;
                }
            }
        }
        return false;
    }

    public void setResendApiKey(String resendApiKey) {
        this.apiKeyExplicitlySet = true;
        this.resendApiKey = resendApiKey;
    }

    public void setEmailFrom(String emailFrom) {
        this.emailFromExplicitlySet = true;
        this.emailFrom = emailFrom;
    }

    @Override
    public void sendVerificationEmail(String email, String name, String otpCode) {
        log.info("[EmailService] Verification OTP generated for email={}: {}", email, otpCode);
        System.out.printf("%n======================================================%n  [VERIFICATION OTP] %s -> %s%n======================================================%n%n", email, otpCode);
        String subject = "Verify your SlotPlay Account";
        String html = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto;\">" +
                "<h2>Verify your SlotPlay Account</h2>" +
                "<p>Hi " + escapeHtml(name) + ",</p>" +
                "<p>Your 6-digit verification code is:</p>" +
                "<h1 style=\"letter-spacing: 5px; color: #16a34a;\">" + escapeHtml(otpCode) + "</h1>" +
                "<p>This code expires in 10 minutes. If you did not request this, please ignore this email.</p>" +
                "</div>";

        sendEmail(email, subject, html, "verification");
    }

    @Override
    public void sendPasswordResetEmail(String email, String name, String otpCode) {
        log.info("[EmailService] Password reset OTP generated for email={}: {}", email, otpCode);
        System.out.printf("%n======================================================%n  [PASSWORD RESET OTP] %s -> %s%n======================================================%n%n", email, otpCode);
        String subject = "Reset your SlotPlay Password";
        String html = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto;\">" +
                "<h2>Reset your SlotPlay Password</h2>" +
                "<p>Hi " + escapeHtml(name) + ",</p>" +
                "<p>Your 6-digit password reset code is:</p>" +
                "<h1 style=\"letter-spacing: 5px; color: #dc2626;\">" + escapeHtml(otpCode) + "</h1>" +
                "<p>This code expires in 10 minutes. Do not share this code with anyone.</p>" +
                "</div>";

        sendEmail(email, subject, html, "password_reset");
    }

    @Override
    public void sendBookingConfirmationEmail(String to, String name, String bookingRef, String venueName,
                                            String address, String date, String startTime, String endTime, BigDecimal amount) {
        String subject = "Booking Confirmed: " + bookingRef;
        String html = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto;\">" +
                "<h2>Booking Confirmed! 🎉</h2>" +
                "<p>Hi " + escapeHtml(name) + ",</p>" +
                "<p>Your slot at <strong>" + escapeHtml(venueName) + "</strong> is confirmed.</p>" +
                "<ul>" +
                "<li><strong>Booking Ref:</strong> " + escapeHtml(bookingRef) + "</li>" +
                "<li><strong>Date:</strong> " + escapeHtml(date) + "</li>" +
                "<li><strong>Time:</strong> " + escapeHtml(startTime) + " - " + escapeHtml(endTime) + "</li>" +
                "<li><strong>Address:</strong> " + escapeHtml(address) + "</li>" +
                "<li><strong>Amount Paid:</strong> ₹" + amount + "</li>" +
                "</ul>" +
                "</div>";

        sendEmail(to, subject, html, "booking_confirmed");
    }

    @Override
    public void sendPaymentSubmittedNotificationEmail(String to, String ownerName, String bookingRef,
                                                     String userName, String userEmail, String venueName,
                                                     BigDecimal amount, String utrNumber) {
        String subject = "Payment Submitted: " + bookingRef;
        String html = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto;\">" +
                "<h2>Payment Submitted for Review</h2>" +
                "<p>Hi " + escapeHtml(ownerName) + ",</p>" +
                "<p>A player has submitted payment proof for verification at <strong>" + escapeHtml(venueName) + "</strong>.</p>" +
                "<ul>" +
                "<li><strong>Booking Ref:</strong> " + escapeHtml(bookingRef) + "</li>" +
                "<li><strong>Player:</strong> " + escapeHtml(userName) + " (" + maskEmail(userEmail) + ")</li>" +
                "<li><strong>Amount:</strong> ₹" + amount + "</li>" +
                "<li><strong>UTR:</strong> " + escapeHtml(utrNumber) + "</li>" +
                "</ul>" +
                "<p>Please review and verify in your owner dashboard.</p>" +
                "</div>";

        sendEmail(to, subject, html, "payment_submitted");
    }

    @Override
    public void sendPaymentApprovedEmail(String to, String name, String bookingRef, String venueName,
                                        String date, String startTime, String endTime, BigDecimal amount) {
        String subject = "Payment Verified: " + bookingRef;
        String html = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto;\">" +
                "<h2>Payment Verified & Booking Confirmed!</h2>" +
                "<p>Hi " + escapeHtml(name) + ",</p>" +
                "<p>Your payment for <strong>" + escapeHtml(venueName) + "</strong> on " + escapeHtml(date) +
                " (" + escapeHtml(startTime) + " - " + escapeHtml(endTime) + ") has been verified.</p>" +
                "<p>Reference: " + escapeHtml(bookingRef) + "</p>" +
                "</div>";

        sendEmail(to, subject, html, "payment_approved");
    }

    @Override
    public void sendPaymentRejectedEmail(String to, String name, String bookingRef, String venueName, String reason) {
        String subject = "Payment Verification Failed: " + bookingRef;
        String html = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto;\">" +
                "<h2>Payment Verification Failed</h2>" +
                "<p>Hi " + escapeHtml(name) + ",</p>" +
                "<p>Your payment for booking <strong>" + escapeHtml(bookingRef) + "</strong> at " + escapeHtml(venueName) +
                " could not be verified.</p>" +
                (reason != null ? "<p><strong>Reason provided by owner:</strong> " + escapeHtml(reason) + "</p>" : "") +
                "<p>Your slot has been released back to availability. Please contact support or re-book.</p>" +
                "</div>";

        sendEmail(to, subject, html, "payment_rejected");
    }

    @Override
    public void sendBookingCancelledEmail(String to, String name, String bookingRef, String venueName, String date) {
        String subject = "Booking Cancelled: " + bookingRef;
        String html = "<div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto;\">" +
                "<h2>Booking Cancelled</h2>" +
                "<p>Hi " + escapeHtml(name) + ",</p>" +
                "<p>Your booking <strong>" + escapeHtml(bookingRef) + "</strong> at " + escapeHtml(venueName) +
                " on " + escapeHtml(date) + " has been cancelled.</p>" +
                "</div>";

        sendEmail(to, subject, html, "booking_cancelled");
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        String key = getEffectiveApiKey();
        String from = getEffectiveEmailFrom();
        if (key != null && !key.isBlank() && !key.equalsIgnoreCase("test")) {
            log.info("[EmailService] Resend email service initialized with sender: {}", from);
        } else {
            if (isProduction()) {
                log.error("[EmailService] Production warning: RESEND_API_KEY is not configured! Real emails cannot be dispatched.");
            } else {
                log.info("[EmailService] RESEND_API_KEY not configured. Emails will be simulated in development mode.");
            }
        }
    }

    public boolean isTestProfile() {
        if (environment != null && environment.getActiveProfiles() != null) {
            for (String profile : environment.getActiveProfiles()) {
                if ("test".equalsIgnoreCase(profile)) {
                    return true;
                }
            }
        }
        return false;
    }

    public String getEffectiveApiKey() {
        if (apiKeyExplicitlySet) {
            return (resendApiKey != null && !resendApiKey.isBlank()) ? resendApiKey.trim() : null;
        }
        if (isTestProfile()) {
            return null;
        }
        if (resendApiKey != null && !resendApiKey.isBlank()) {
            return resendApiKey.trim();
        }
        if (environment != null) {
            String envKey = environment.getProperty("RESEND_API_KEY");
            if (envKey != null && !envKey.isBlank()) {
                return envKey.trim();
            }
        }
        String dotEnvKey = DataSourceConfig.readDotEnvProperty("RESEND_API_KEY");
        if (dotEnvKey != null && !dotEnvKey.isBlank()) {
            return dotEnvKey.trim();
        }
        return null;
    }

    public String getEffectiveEmailFrom() {
        if (emailFromExplicitlySet) {
            return (emailFrom != null && !emailFrom.isBlank()) ? emailFrom.trim() : "SlotPlay <slotplay@nmart.me>";
        }
        if (emailFrom != null && !emailFrom.isBlank() && !emailFrom.equals("SlotPlay <slotplay@nmart.me>")) {
            return emailFrom.trim();
        }
        if (environment != null) {
            String envFrom = environment.getProperty("EMAIL_FROM");
            if (envFrom != null && !envFrom.isBlank()) {
                return envFrom.trim();
            }
            String resendFrom = environment.getProperty("RESEND_FROM_EMAIL");
            if (resendFrom != null && !resendFrom.isBlank()) {
                return resendFrom.trim();
            }
        }
        String dotEnvFrom = DataSourceConfig.readDotEnvProperty("EMAIL_FROM");
        if (dotEnvFrom != null && !dotEnvFrom.isBlank()) {
            return dotEnvFrom.trim();
        }
        String dotEnvResendFrom = DataSourceConfig.readDotEnvProperty("RESEND_FROM_EMAIL");
        if (dotEnvResendFrom != null && !dotEnvResendFrom.isBlank()) {
            return dotEnvResendFrom.trim();
        }
        return "SlotPlay <slotplay@nmart.me>";
    }

    private void sendEmail(String to, String subject, String htmlContent, String emailType) {
        String maskedRecipient = maskEmail(to);

        boolean isProd = isProduction();
        String apiKey = getEffectiveApiKey();
        boolean hasValidKey = apiKey != null && !apiKey.trim().isEmpty() && !apiKey.trim().equalsIgnoreCase("test");

        if (!hasValidKey) {
            if (isProd) {
                log.error("[EmailService] Production email delivery aborted: RESEND_API_KEY is missing or unconfigured. Refusing to falsely simulate delivery of {} email to {}",
                        emailType, maskedRecipient);
                throw new EmailDeliveryException("Production email error: RESEND_API_KEY is missing or invalid. Cannot dispatch " + emailType + " email.");
            } else {
                log.info("[EmailService] Resend API key is not configured; simulated {} email to {}",
                        emailType, maskedRecipient);
                return;
            }
        }

        try {
            String from = getEffectiveEmailFrom();
            ResendEmailRequest payload = new ResendEmailRequest(from, List.of(to), subject, htmlContent);

            restClient.post()
                    .uri("/emails")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();

            log.info("[EmailService] Successfully dispatched {} email via Resend to {}", emailType, maskedRecipient);
        } catch (RestClientResponseException e) {
            log.error("[EmailService] Resend HTTP {} error for {} email to {}: {}",
                    e.getStatusCode().value(), emailType, maskedRecipient, e.getStatusText());
            if (!isProd) {
                log.warn("[EmailService] [DEV MODE] Suppressed Resend HTTP error in development mode. Email was: {}", emailType);
                return;
            }
            throw new EmailDeliveryException("Failed to dispatch " + emailType + " email via Resend: HTTP " + e.getStatusCode().value(), e);
        } catch (Exception e) {
            log.error("[EmailService] Unexpected communication failure dispatching {} email to {}: {}",
                    emailType, maskedRecipient, e.getMessage());
            if (!isProd) {
                log.warn("[EmailService] [DEV MODE] Suppressed communication failure in development mode. Email was: {}", emailType);
                return;
            }
            throw new EmailDeliveryException("Unexpected failure dispatching " + emailType + " email", e);
        }
    }

    private String maskEmail(String email) {
        if (email == null) return "unknown";
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) return "***@" + (atIndex >= 0 ? email.substring(atIndex + 1) : "unknown");
        return email.charAt(0) + "***" + email.substring(atIndex);
    }

    private String escapeHtml(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#x27;");
    }

    public record ResendEmailRequest(
            @JsonProperty("from") String from,
            @JsonProperty("to") List<String> to,
            @JsonProperty("subject") String subject,
            @JsonProperty("html") String html
    ) {}
}
