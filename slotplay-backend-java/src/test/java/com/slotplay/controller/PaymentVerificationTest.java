package com.slotplay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.CreateBookingRequest;
import com.slotplay.dto.VerifyPaymentRequest;
import com.slotplay.entity.*;
import com.slotplay.repository.*;
import com.slotplay.security.UserPrincipal;
import com.slotplay.service.BookingService;
import com.slotplay.service.SlotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class PaymentVerificationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private SlotService slotService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private SportRepository sportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentVerificationRepository paymentVerificationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User ownerUser;
    private User otherOwnerUser;
    private User playerUser;
    private User adminUser;
    private Venue venue;
    private Slot slot;

    @BeforeEach
    void setUp() {
        Role ownerRole = roleRepository.findByName("owner")
                .orElseGet(() -> roleRepository.save(new Role("owner")));
        Role playerRole = roleRepository.findByName("user")
                .orElseGet(() -> roleRepository.save(new Role("user")));
        Role adminRole = roleRepository.findByName("admin")
                .orElseGet(() -> roleRepository.save(new Role("admin")));

        ownerUser = new User();
        ownerUser.setName("Arena Owner");
        ownerUser.setEmail("owner." + UUID.randomUUID() + "@slotplay.in");
        ownerUser.setPasswordHash("hashed_pass");
        ownerUser.setRole(ownerRole);
        ownerUser.setVerified(true);
        ownerUser.setPhone("9876543110");
        ownerUser = userRepository.save(ownerUser);

        otherOwnerUser = new User();
        otherOwnerUser.setName("Other Owner");
        otherOwnerUser.setEmail("other." + UUID.randomUUID() + "@slotplay.in");
        otherOwnerUser.setPasswordHash("hashed_pass");
        otherOwnerUser.setRole(ownerRole);
        otherOwnerUser.setVerified(true);
        otherOwnerUser.setPhone("9876543111");
        otherOwnerUser = userRepository.save(otherOwnerUser);

        playerUser = new User();
        playerUser.setName("Player User");
        playerUser.setEmail("player." + UUID.randomUUID() + "@slotplay.in");
        playerUser.setPasswordHash("hashed_pass");
        playerUser.setRole(playerRole);
        playerUser.setVerified(true);
        playerUser.setPhone("9876543112");
        playerUser = userRepository.save(playerUser);

        adminUser = new User();
        adminUser.setName("Platform Admin");
        adminUser.setEmail("admin." + UUID.randomUUID() + "@slotplay.in");
        adminUser.setPasswordHash("hashed_pass");
        adminUser.setRole(adminRole);
        adminUser.setVerified(true);
        adminUser.setPhone("9876543113");
        adminUser = userRepository.save(adminUser);

        Sport sport = sportRepository.findByName("Cricket")
                .orElseGet(() -> sportRepository.save(new Sport("Cricket", "https://slotplay.in/cricket.svg")));

        venue = new Venue();
        venue.setOwner(ownerUser);
        venue.setSport(sport);
        venue.setName("Pro Sports Arena");
        venue.setAddress("Hitec City");
        venue.setCity("Hyderabad");
        venue.setState("Telangana");
        venue.setPincode("500081");
        venue.setPricePerHour(BigDecimal.valueOf(1500.00));
        venue.setStatus("active");
        venue.setVerified(true);
        venue = venueRepository.save(venue);

        slot = new Slot(
                venue,
                LocalDate.parse("2026-11-20"),
                LocalTime.of(19, 0),
                LocalTime.of(20, 0),
                BigDecimal.valueOf(1500.00),
                "available"
        );
        slot = slotRepository.save(slot);
    }

    private MockHttpSession createAuthSession(User user) {
        MockHttpSession session = new MockHttpSession();
        UserPrincipal principal = UserPrincipal.create(user);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        session.setAttribute("SPRING_SECURITY_CONTEXT", context);
        return session;
    }

    @Test
    @DisplayName("Success: Owner approves payment, audit record preserved with reviewer and timestamps")
    void testOwnerApprovesPaymentSuccess() throws Exception {
        var booking = bookingService.createBooking(playerUser.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));

        bookingService.submitPayment(playerUser.getId(), booking.getId(), "987654321012", null, "https://storage.slotplay.in/shot.png");

        VerifyPaymentRequest verifyReq = new VerifyPaymentRequest(true, null);

        mockMvc.perform(post("/api/bookings/" + booking.getId() + "/verify")
                        .session(createAuthSession(ownerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Payment verified. User has been notified."));

        // Verify audit record in database
        PaymentVerification pv = paymentVerificationRepository.findFirstByBookingIdOrderByCreatedAtDesc(booking.getId()).orElseThrow();
        assertEquals("approved", pv.getStatus());
        assertNotNull(pv.getReviewedAt(), "Audit review timestamp must be set");
        assertNotNull(pv.getReviewedBy(), "Audit reviewer must be preserved");
        assertEquals(ownerUser.getId(), pv.getReviewedBy().getId(), "Reviewed by must match venue owner");

        Booking updated = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals("confirmed", updated.getStatus());
        assertNotNull(updated.getConfirmedAt());
        assertNotNull(updated.getQrCodeUrl());

        Payment payment = paymentRepository.findByBookingId(booking.getId()).orElseThrow();
        assertEquals("verified", payment.getStatus());

        // Verify player received in-app notification
        var notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(playerUser.getId(), null);
        assertFalse(notifications.isEmpty());
        assertTrue(notifications.getContent().stream().anyMatch(n -> "booking_confirmed".equals(n.getType())));
    }

    @Test
    @DisplayName("Success: Owner rejects payment, reason recorded in audit and slot released back to available")
    void testOwnerRejectsPaymentSuccess() throws Exception {
        var booking = bookingService.createBooking(playerUser.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));

        bookingService.submitPayment(playerUser.getId(), booking.getId(), "987654321012", null, "https://storage.slotplay.in/shot.png");

        VerifyPaymentRequest verifyReq = new VerifyPaymentRequest(false, "UTR does not match credit in statement");

        mockMvc.perform(post("/api/bookings/" + booking.getId() + "/verify")
                        .session(createAuthSession(ownerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Payment rejected. User has been notified."));

        PaymentVerification pv = paymentVerificationRepository.findFirstByBookingIdOrderByCreatedAtDesc(booking.getId()).orElseThrow();
        assertEquals("rejected", pv.getStatus());
        assertEquals("UTR does not match credit in statement", pv.getReviewNote(), "Rejection audit note must be preserved");
        assertNotNull(pv.getReviewedBy());

        Booking updated = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals("rejected", updated.getStatus());

        // Slot must be available again
        assertTrue(slotService.isSlotAvailable(slot.getId()), "Slot must be restored to available upon payment rejection");

        // Player notification
        var notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(playerUser.getId(), null);
        assertTrue(notifications.getContent().stream().anyMatch(n -> "payment_rejected".equals(n.getType())));
    }

    @Test
    @DisplayName("Unauthorized: Non-owner cannot verify payment (returns 403 FORBIDDEN)")
    void testNonOwnerCannotVerifyPayment() throws Exception {
        var booking = bookingService.createBooking(playerUser.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));
        bookingService.submitPayment(playerUser.getId(), booking.getId(), "987654321012", null, "https://storage.slotplay.in/shot.png");

        VerifyPaymentRequest verifyReq = new VerifyPaymentRequest(true, null);

        // otherOwnerUser attempts to verify
        mockMvc.perform(post("/api/bookings/" + booking.getId() + "/verify")
                        .session(createAuthSession(otherOwnerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                .andExpect(jsonPath("$.message").value("You do not own this venue"));
    }

    @Test
    @DisplayName("Unauthorized: Unauthenticated request to verify returns 401")
    void testUnauthenticatedVerifyReturns401() throws Exception {
        var booking = bookingService.createBooking(playerUser.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));
        VerifyPaymentRequest verifyReq = new VerifyPaymentRequest(true, null);

        mockMvc.perform(post("/api/bookings/" + booking.getId() + "/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORISED"));
    }

    @Test
    @DisplayName("Idempotent Retry: Repeated approval on already confirmed booking succeeds without duplicate side-effects")
    void testRepeatedApprovalIdempotent() throws Exception {
        var booking = bookingService.createBooking(playerUser.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));
        bookingService.submitPayment(playerUser.getId(), booking.getId(), "987654321012", null, "https://storage.slotplay.in/shot.png");

        VerifyPaymentRequest verifyReq = new VerifyPaymentRequest(true, null);

        // First verification
        mockMvc.perform(post("/api/bookings/" + booking.getId() + "/verify")
                        .session(createAuthSession(ownerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk());

        // Repeated idempotent verification request (e.g. user double-clicked or network retry)
        mockMvc.perform(post("/api/bookings/" + booking.getId() + "/verify")
                        .session(createAuthSession(ownerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        Booking confirmed = bookingRepository.findById(booking.getId()).orElseThrow();
        assertEquals("confirmed", confirmed.getStatus());
    }

    @Test
    @DisplayName("Conflicting Retry: Rejecting an already confirmed booking returns 400 INVALID_STATE")
    void testConflictingDecisionOnConfirmedBookingFails() throws Exception {
        var booking = bookingService.createBooking(playerUser.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));
        bookingService.submitPayment(playerUser.getId(), booking.getId(), "987654321012", null, "https://storage.slotplay.in/shot.png");

        // First verify approved
        bookingService.verifyPayment(ownerUser.getId(), false, booking.getId(), new VerifyPaymentRequest(true, null));

        // Attempting to reject an already confirmed booking
        mockMvc.perform(post("/api/bookings/" + booking.getId() + "/verify")
                        .session(createAuthSession(ownerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new VerifyPaymentRequest(false, "Changed mind"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INVALID_STATE"));
    }

    @Test
    @DisplayName("Multipart Payment Submission: Uploading screenshot file with valid UTR")
    void testMultipartPaymentSubmission() throws Exception {
        var booking = bookingService.createBooking(playerUser.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));

        // Valid 1x1 PNG image
        byte[] validPng = new byte[] {
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, (byte) 0xC4,
                (byte) 0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
                0x54, 0x78, (byte) 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
                0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, (byte) 0xB4, 0x00,
                0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE,
                0x42, 0x60, (byte) 0x82
        };

        MockMultipartFile screenshotFile = new MockMultipartFile(
                "screenshot",
                "payment_proof.png",
                "image/png",
                validPng
        );

        mockMvc.perform(multipart("/api/bookings/" + booking.getId() + "/payment")
                        .file(screenshotFile)
                        .param("utrNumber", "987654321012")
                        .session(createAuthSession(playerUser)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.utrNumber").value("987654321012"))
                .andExpect(jsonPath("$.data.screenshotUrl", startsWith("/uploads/payment-screenshots/")));

        // Venue owner receives notification
        var ownerNotifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(ownerUser.getId(), null);
        assertTrue(ownerNotifs.getContent().stream().anyMatch(n -> "payment_submitted".equals(n.getType())));
    }

    @Test
    @DisplayName("Failure: Submitting payment for non-owned booking returns 403 FORBIDDEN")
    void testNonOwnerCannotSubmitPayment() throws Exception {
        var booking = bookingService.createBooking(playerUser.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));

        mockMvc.perform(post("/api/bookings/" + booking.getId() + "/payment")
                        .session(createAuthSession(ownerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "utrNumber", "987654321012",
                                "screenshotUrl", "https://storage.slotplay.in/proof.png"
                        ))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    @DisplayName("Failure: Submitting payment for cancelled booking returns 400 INVALID_STATE")
    void testSubmitPaymentForCancelledBookingFails() throws Exception {
        var booking = bookingService.createBooking(playerUser.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));
        bookingService.cancelBooking(booking.getId(), playerUser.getId());

        mockMvc.perform(post("/api/bookings/" + booking.getId() + "/payment")
                        .session(createAuthSession(playerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "utrNumber", "987654321012",
                                "screenshotUrl", "https://storage.slotplay.in/proof.png"
                        ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("INVALID_STATE"));
    }
}
