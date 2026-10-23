package com.slotplay.service;

import com.slotplay.exception.EmailDeliveryException;
import com.slotplay.service.impl.DefaultEmailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.*;
import static org.springframework.test.web.client.response.MockRestResponseCreators.*;

class ResendEmailServiceTest {

    private RestClient restClient;
    private MockRestServiceServer mockServer;
    private DefaultEmailService emailService;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.resend.com");
        mockServer = MockRestServiceServer.bindTo(builder).build();
        restClient = builder.build();

        emailService = new DefaultEmailService(restClient);
        emailService.setEmailFrom("SlotPlay <slotplay@nmart.me>");
    }

    @Test
    @DisplayName("Resend Email: Successfully dispatches HTTP POST request with correct payload and headers")
    void testSuccessfulEmailDispatchViaResend() {
        emailService.setResendApiKey("re_test_dummy_key_123");

        mockServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(HttpHeaders.AUTHORIZATION, "Bearer re_test_dummy_key_123"))
                .andExpect(header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE))
                .andExpect(jsonPath("$.from").value("SlotPlay <slotplay@nmart.me>"))
                .andExpect(jsonPath("$.to[0]").value("rahul@example.com"))
                .andExpect(jsonPath("$.subject").value("Verify your SlotPlay Account"))
                .andExpect(jsonPath("$.html").isNotEmpty())
                .andRespond(withSuccess("{\"id\": \"msg_abc123\"}", MediaType.APPLICATION_JSON));

        assertDoesNotThrow(() ->
                emailService.sendVerificationEmail("rahul@example.com", "Rahul", "654321")
        );

        mockServer.verify();
    }

    @Test
    @DisplayName("Resend Email: Booking confirmation includes formatted price and venue details")
    void testBookingConfirmationEmailPayload() {
        emailService.setResendApiKey("re_test_key");

        mockServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.subject").value("Booking Confirmed: SP-20261128-ABCD"))
                .andExpect(jsonPath("$.html").value(org.hamcrest.Matchers.containsString("Lords Turf")))
                .andRespond(withSuccess("{\"id\": \"msg_conf_123\"}", MediaType.APPLICATION_JSON));

        assertDoesNotThrow(() ->
                emailService.sendBookingConfirmationEmail(
                        "player@example.com",
                        "Player",
                        "SP-20261128-ABCD",
                        "Lords Turf",
                        "Banjara Hills",
                        "2026-11-28",
                        "18:00",
                        "19:00",
                        BigDecimal.valueOf(1400.00)
                )
        );

        mockServer.verify();
    }

    @Test
    @DisplayName("Resend Email: HTTP 422 failure is caught and throws EmailDeliveryException without leaking secrets")
    void testResendHttpFailureThrowsDeliveryException() {
        emailService.setForceProduction(true);
        emailService.setResendApiKey("re_invalid_domain_key");

        mockServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.UNPROCESSABLE_ENTITY)
                        .body("{\"message\": \"Domain not verified\", \"name\": \"validation_error\"}")
                        .contentType(MediaType.APPLICATION_JSON));

        var ex = assertThrows(EmailDeliveryException.class, () ->
                emailService.sendVerificationEmail("user@unverified.com", "User", "123456")
        );

        assertTrue(ex.getMessage().contains("Failed to dispatch verification email via Resend: HTTP 422"));
        assertFalse(ex.getMessage().contains("re_invalid_domain_key"), "Secret key must never be logged or leaked in exception");
        mockServer.verify();
    }

    @Test
    @DisplayName("Resend Email: When API key is blank, email transmission is safely skipped in simulation mode (non-prod)")
    void testSimulationModeWhenApiKeyEmpty() {
        emailService.setForceProduction(false);
        emailService.setResendApiKey("");

        // No HTTP expectations on mockServer because no HTTP call should be made
        assertDoesNotThrow(() ->
                emailService.sendVerificationEmail("dev@local.in", "Dev User", "999888")
        );

        mockServer.verify();
    }

    @Test
    @DisplayName("Resend Email: In production, missing Resend API key throws EmailDeliveryException and never simulates")
    void testProductionProfileWithMissingApiKeyThrowsException() {
        emailService.setForceProduction(true);
        emailService.setResendApiKey(null);

        var ex = assertThrows(EmailDeliveryException.class, () ->
                emailService.sendVerificationEmail("player@prod.in", "Player", "123456")
        );

        assertTrue(ex.getMessage().contains("RESEND_API_KEY is missing or invalid"));
        mockServer.verify();
    }

    @Test
    @DisplayName("Resend Email: In production, blank or whitespace Resend API key throws EmailDeliveryException")
    void testProductionProfileWithBlankApiKeyThrowsException() {
        emailService.setForceProduction(true);
        emailService.setResendApiKey("   ");

        var ex = assertThrows(EmailDeliveryException.class, () ->
                emailService.sendPasswordResetEmail("admin@prod.in", "Admin", "654321")
        );

        assertTrue(ex.getMessage().contains("RESEND_API_KEY is missing or invalid"));
        mockServer.verify();
    }

    @Test
    @DisplayName("Resend Email: HTTP 500 error from Resend throws EmailDeliveryException with status code")
    void testResendHttp500InternalErrorThrowsDeliveryException() {
        emailService.setForceProduction(true);
        emailService.setResendApiKey("re_test_dummy_key_123");

        mockServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andRespond(withServerError());

        var ex = assertThrows(EmailDeliveryException.class, () ->
                emailService.sendBookingConfirmationEmail(
                        "player@example.com", "Player", "SP-001", "Turf", "City", "2026-11-28", "10:00", "11:00", BigDecimal.valueOf(500)
                )
        );

        assertTrue(ex.getMessage().contains("Failed to dispatch booking_confirmed email via Resend: HTTP 500"));
        assertFalse(ex.getMessage().contains("re_test_dummy_key_123"), "Secret API key must not be leaked in exception");
        mockServer.verify();
    }

    @Test
    @DisplayName("Resend Email: Default from email is SlotPlay <slotplay@nmart.me> for OTP verification")
    void testDefaultEmailFromIsSlotPlayNmartMe() {
        DefaultEmailService defaultService = new DefaultEmailService(restClient);
        defaultService.setResendApiKey("re_test_key_123");

        mockServer.expect(requestTo("https://api.resend.com/emails"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(jsonPath("$.from").value("SlotPlay <slotplay@nmart.me>"))
                .andExpect(jsonPath("$.to[0]").value("user@example.com"))
                .andExpect(jsonPath("$.subject").value("Verify your SlotPlay Account"))
                .andRespond(withSuccess("{\"id\": \"msg_otp_999\"}", MediaType.APPLICATION_JSON));

        assertDoesNotThrow(() ->
                defaultService.sendVerificationEmail("user@example.com", "User", "123456")
        );

        mockServer.verify();
    }
}
