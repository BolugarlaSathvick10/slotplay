package com.slotplay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.CreateBookingRequest;
import com.slotplay.dto.VerifyPaymentRequest;
import com.slotplay.dto.VerifyTicketRequest;
import com.slotplay.entity.*;
import com.slotplay.exception.AppException;
import com.slotplay.repository.*;
import com.slotplay.security.UserPrincipal;
import com.slotplay.service.BookingService;
import com.slotplay.service.SlotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class BookingTest {

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

    private User ownerUser;
    private User playerUser1;
    private User playerUser2;
    private Venue venue;
    private Slot slot;

    @BeforeEach
    void setUp() {
        Role ownerRole = roleRepository.findByName("owner")
                .orElseGet(() -> roleRepository.save(new Role("owner")));
        Role playerRole = roleRepository.findByName("user")
                .orElseGet(() -> roleRepository.save(new Role("user")));

        ownerUser = new User();
        ownerUser.setName("Arena Owner");
        ownerUser.setEmail("owner." + UUID.randomUUID() + "@slotplay.in");
        ownerUser.setPasswordHash("hashed_pass");
        ownerUser.setRole(ownerRole);
        ownerUser.setVerified(true);
        ownerUser.setPhone("9876543230");
        ownerUser = userRepository.save(ownerUser);

        playerUser1 = new User();
        playerUser1.setName("Alice Player");
        playerUser1.setEmail("alice." + UUID.randomUUID() + "@slotplay.in");
        playerUser1.setPasswordHash("hashed_pass");
        playerUser1.setRole(playerRole);
        playerUser1.setVerified(true);
        playerUser1.setPhone("9876543231");
        playerUser1 = userRepository.save(playerUser1);

        playerUser2 = new User();
        playerUser2.setName("Bob Player");
        playerUser2.setEmail("bob." + UUID.randomUUID() + "@slotplay.in");
        playerUser2.setPasswordHash("hashed_pass");
        playerUser2.setRole(playerRole);
        playerUser2.setVerified(true);
        playerUser2.setPhone("9876543232");
        playerUser2 = userRepository.save(playerUser2);

        Sport sport = sportRepository.findByName("Cricket")
                .orElseGet(() -> sportRepository.save(new Sport("Cricket", "https://slotplay.in/cricket.svg")));

        venue = new Venue();
        venue.setOwner(ownerUser);
        venue.setSport(sport);
        venue.setName("Champions Turf");
        venue.setAddress("Gachibowli Outer Ring Road");
        venue.setCity("Hyderabad");
        venue.setState("Telangana");
        venue.setPincode("500032");
        venue.setPricePerHour(BigDecimal.valueOf(1200.00));
        venue.setStatus("active");
        venue.setVerified(true);
        venue = venueRepository.save(venue);

        slot = new Slot(
                venue,
                LocalDate.parse("2026-11-15"),
                LocalTime.of(18, 0),
                LocalTime.of(19, 0),
                BigDecimal.valueOf(1200.00),
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

    @Nested
    @DisplayName("Simultaneous Booking Attempts & Repeated Requests Tests")
    class ConcurrencyAndDoubleBookingTests {

        @Test
        @DisplayName("Repeated booking request for same slot by same or different user fails with 409 Conflict")
        void repeatedBookingRequestRejected() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());

            // First request succeeds
            mockMvc.perform(post("/api/bookings")
                            .session(createAuthSession(playerUser1))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Booking created. You have 30 minutes to submit payment."))
                    .andExpect(jsonPath("$.data.status").value("pending_payment"))
                    .andExpect(jsonPath("$.data.totalAmount").value(1200.00));

            // Second repeated request by playerUser1 fails
            mockMvc.perform(post("/api/bookings")
                            .session(createAuthSession(playerUser1))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("SLOT_UNAVAILABLE"))
                    .andExpect(jsonPath("$.message").value("This slot is already booked"));

            // Repeated request by playerUser2 also fails
            mockMvc.perform(post("/api/bookings")
                            .session(createAuthSession(playerUser2))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("SLOT_UNAVAILABLE"));
        }

        @Test
        @DisplayName("Simultaneous concurrent booking attempts: exactly 1 succeeds, remaining fail with 409 Conflict")
        @Transactional(propagation = Propagation.NOT_SUPPORTED)
        void testSimultaneousBookingAttempts() throws Exception {
            try {
                int numThreads = 6;
                ExecutorService executor = Executors.newFixedThreadPool(numThreads);
                CountDownLatch readyLatch = new CountDownLatch(numThreads);
                CountDownLatch startLatch = new CountDownLatch(1);

                AtomicInteger successCount = new AtomicInteger(0);
                AtomicInteger conflictCount = new AtomicInteger(0);

                List<Future<?>> futures = new ArrayList<>();

                for (int i = 0; i < numThreads; i++) {
                    final int idx = i;
                    futures.add(executor.submit(() -> {
                        readyLatch.countDown();
                        try {
                            startLatch.await(); // Synchronize all threads to fire simultaneously

                            UUID actingUserId = (idx % 2 == 0) ? playerUser1.getId() : playerUser2.getId();
                            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());

                            bookingService.createBooking(actingUserId, req);
                            successCount.incrementAndGet();
                        } catch (AppException e) {
                            if (e.getStatus() == HttpStatus.CONFLICT && "SLOT_UNAVAILABLE".equals(e.getCode())) {
                                conflictCount.incrementAndGet();
                            } else {
                                throw new RuntimeException("Unexpected exception: " + e.getMessage(), e);
                            }
                        } catch (Exception e) {
                            throw new RuntimeException(e);
                        }
                    }));
                }

                readyLatch.await();
                startLatch.countDown(); // Fire!

                for (Future<?> f : futures) {
                    f.get();
                }

                executor.shutdown();
                assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));

                assertEquals(1, successCount.get(), "Exactly one booking creation attempt must succeed");
                assertEquals(numThreads - 1, conflictCount.get(), "All other concurrent attempts must receive 409 Conflict");

                // Verify in database that exactly 1 booking exists for this slot
                List<Booking> bookings = bookingRepository.findBySlotIdInAndStatusIn(
                        List.of(slot.getId()),
                        List.of("pending_payment", "pending_verification", "confirmed")
                );
                assertEquals(1, bookings.size(), "Only 1 active booking must exist in database");
            } finally {
                // Cleanup child records first, then parent records
                paymentVerificationRepository.deleteAll();
                paymentRepository.deleteAll();
                bookingRepository.deleteAll();
                slotRepository.delete(slot);
                venueRepository.delete(venue);
                userRepository.delete(playerUser1);
                userRepository.delete(playerUser2);
                userRepository.delete(ownerUser);
            }
        }
    }

    @Nested
    @DisplayName("Cancellations Tests")
    class CancellationTests {

        @Test
        @DisplayName("User can cancel their own booking when in pending_payment status")
        void userCancelsPendingPaymentBooking() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            var booking = bookingService.createBooking(playerUser1.getId(), req);

            // Cancel booking
            mockMvc.perform(delete("/api/bookings/" + booking.getId())
                            .session(createAuthSession(playerUser1)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Booking cancelled successfully"));

            // Verify status in repository
            Booking updated = bookingRepository.findById(booking.getId()).orElseThrow();
            assertEquals("cancelled", updated.getStatus());
            assertNotNull(updated.getCancelledAt());

            // Verify slot is now available again for booking!
            assertTrue(slotService.isSlotAvailable(slot.getId()));

            // Another player can now book this slot
            mockMvc.perform(post("/api/bookings")
                            .session(createAuthSession(playerUser2))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Cancelling an already cancelled booking returns 400 CANNOT_CANCEL")
        void cancelAlreadyCancelledBooking() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            var booking = bookingService.createBooking(playerUser1.getId(), req);

            bookingService.cancelBooking(booking.getId(), playerUser1.getId());

            mockMvc.perform(delete("/api/bookings/" + booking.getId())
                            .session(createAuthSession(playerUser1)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("CANNOT_CANCEL"))
                    .andExpect(jsonPath("$.message").value("Only pending_payment bookings can be cancelled"));
        }

        @Test
        @DisplayName("Non-owner of booking cannot cancel it (returns 403 FORBIDDEN)")
        void nonOwnerCannotCancelBooking() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            var booking = bookingService.createBooking(playerUser1.getId(), req);

            mockMvc.perform(delete("/api/bookings/" + booking.getId())
                            .session(createAuthSession(playerUser2)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.message").value("This booking does not belong to you"));
        }

        @Test
        @DisplayName("Confirmed booking cannot be cancelled (returns 400 CANNOT_CANCEL)")
        void confirmedBookingCannotBeCancelled() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            var booking = bookingService.createBooking(playerUser1.getId(), req);

            // Submit payment
            bookingService.submitPayment(playerUser1.getId(), booking.getId(), "123456789012", null, "https://storage.slotplay.in/proof.png");

            // Owner approves payment -> confirmed
            bookingService.verifyPayment(ownerUser.getId(), false, booking.getId(), new VerifyPaymentRequest(true, null));

            mockMvc.perform(delete("/api/bookings/" + booking.getId())
                            .session(createAuthSession(playerUser1)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("CANNOT_CANCEL"));
        }
    }

    @Nested
    @DisplayName("QR Ticket Verification Tests")
    class QrTicketTests {

        @Test
        @DisplayName("Valid confirmed booking QR ticket verifies successfully")
        void validQrTicketVerification() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            var booking = bookingService.createBooking(playerUser1.getId(), req);

            bookingService.submitPayment(playerUser1.getId(), booking.getId(), "123456789012", null, "https://storage.slotplay.in/proof.png");
            bookingService.verifyPayment(ownerUser.getId(), false, booking.getId(), new VerifyPaymentRequest(true, null));

            Booking confirmedBooking = bookingRepository.findById(booking.getId()).orElseThrow();
            String qrPayload = objectMapper.writeValueAsString(Map.of(
                    "ref", confirmedBooking.getBookingRef(),
                    "venue", "Champions Turf",
                    "slot", "18:00",
                    "amount", 1200.00
            ));

            VerifyTicketRequest verifyReq = new VerifyTicketRequest(qrPayload);

            mockMvc.perform(post("/api/bookings/ticket/verify")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(verifyReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.valid").value(true))
                    .andExpect(jsonPath("$.data.ticket.ref").value(confirmedBooking.getBookingRef()))
                    .andExpect(jsonPath("$.data.ticket.venue").value("Champions Turf"))
                    .andExpect(jsonPath("$.data.ticket.slot").value("18:00"))
                    .andExpect(jsonPath("$.data.ticket.amount").value(1200.00))
                    .andExpect(jsonPath("$.data.booking.status").value("confirmed"));
        }

        @Test
        @DisplayName("QR ticket with non-existent ref returns 404 / INVALID_TICKET")
        void nonExistentTicketRef() throws Exception {
            String invalidPayload = objectMapper.writeValueAsString(Map.of(
                    "ref", "SP-20261115-XXXX",
                    "venue", "Fake Turf",
                    "slot", "18:00",
                    "amount", 1000
            ));

            mockMvc.perform(post("/api/bookings/ticket/verify")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new VerifyTicketRequest(invalidPayload))))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_TICKET"));
        }

        @Test
        @DisplayName("QR ticket for cancelled booking returns 400 TICKET_CANCELLED")
        void cancelledTicketVerification() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            var booking = bookingService.createBooking(playerUser1.getId(), req);

            bookingService.cancelBooking(booking.getId(), playerUser1.getId());
            Booking cancelled = bookingRepository.findById(booking.getId()).orElseThrow();

            String payload = objectMapper.writeValueAsString(Map.of(
                    "ref", cancelled.getBookingRef()
            ));

            mockMvc.perform(post("/api/bookings/ticket/verify")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new VerifyTicketRequest(payload))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("TICKET_CANCELLED"))
                    .andExpect(jsonPath("$.message").value("Ticket is invalid: booking has been cancelled"));
        }

        @Test
        @DisplayName("QR ticket for unconfirmed (pending_payment) booking returns 400 TICKET_NOT_CONFIRMED")
        void unconfirmedTicketVerification() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            var booking = bookingService.createBooking(playerUser1.getId(), req);

            String payload = objectMapper.writeValueAsString(Map.of(
                    "ref", booking.getBookingRef()
            ));

            mockMvc.perform(post("/api/bookings/ticket/verify")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new VerifyTicketRequest(payload))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("TICKET_NOT_CONFIRMED"));
        }

        @Test
        @DisplayName("Malformed QR ticket data returns 400 INVALID_TICKET")
        void malformedQrData() throws Exception {
            VerifyTicketRequest badJson = new VerifyTicketRequest("{unclosed_json: true");

            mockMvc.perform(post("/api/bookings/ticket/verify")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(badJson)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_TICKET"));
        }

        @Test
        @DisplayName("Tampered QR ticket with mismatched amount returns 400 INVALID_TICKET")
        void tamperedAmountTicket() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            var booking = bookingService.createBooking(playerUser1.getId(), req);

            bookingService.submitPayment(playerUser1.getId(), booking.getId(), "123456789012", null, "https://storage.slotplay.in/proof.png");
            bookingService.verifyPayment(ownerUser.getId(), false, booking.getId(), new VerifyPaymentRequest(true, null));

            Booking confirmedBooking = bookingRepository.findById(booking.getId()).orElseThrow();

            // Tamper amount to 100 instead of 1200
            String tamperedPayload = objectMapper.writeValueAsString(Map.of(
                    "ref", confirmedBooking.getBookingRef(),
                    "amount", 100.00
            ));

            mockMvc.perform(post("/api/bookings/ticket/verify")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new VerifyTicketRequest(tamperedPayload))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_TICKET"))
                    .andExpect(jsonPath("$.message").value("Ticket amount mismatch"));
        }
    }

    @Nested
    @DisplayName("Payment Submission & Owner Verification Workflow Tests")
    class PaymentAndVerificationWorkflowTests {

        @Test
        @DisplayName("Full workflow: create -> submit payment with UTR -> owner verifies -> verified booking detail")
        void fullPaymentVerificationWorkflow() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            var booking = bookingService.createBooking(playerUser1.getId(), req);

            // Invalid UTR (less than 12 digits) returns 400 INVALID_UTR
            mockMvc.perform(post("/api/bookings/" + booking.getId() + "/payment")
                            .session(createAuthSession(playerUser1))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "utrNumber", "12345",
                                    "screenshotUrl", "https://storage.slotplay.in/shot.webp"
                            ))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_UTR"));

            // Valid UTR submission (12 digits)
            mockMvc.perform(post("/api/bookings/" + booking.getId() + "/payment")
                            .session(createAuthSession(playerUser1))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(Map.of(
                                    "utrNumber", "987654321012",
                                    "screenshotUrl", "https://storage.slotplay.in/shot.webp"
                            ))))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Payment submitted. The venue owner will verify within 24 hours."))
                    .andExpect(jsonPath("$.data.utrNumber").value("987654321012"))
                    .andExpect(jsonPath("$.data.status").value("submitted"));

            // Check owner pending verifications queue
            mockMvc.perform(get("/api/owner/verifications")
                            .session(createAuthSession(ownerUser)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.data", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.data[0].id").value(booking.getId().toString()))
                    // Verify paymentVerification alias for frontend compatibility (audit item 7.5)
                    .andExpect(jsonPath("$.data.data[0].paymentVerification.utrNumber").value("987654321012"));

            // Non-owner attempting to verify payment returns 403 FORBIDDEN
            mockMvc.perform(post("/api/bookings/" + booking.getId() + "/verify")
                            .session(createAuthSession(playerUser2))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new VerifyPaymentRequest(true, null))))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));

            // Owner approves payment
            mockMvc.perform(post("/api/bookings/" + booking.getId() + "/verify")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new VerifyPaymentRequest(true, null))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Payment verified. User has been notified."));

            // Retrieve booking detail
            mockMvc.perform(get("/api/bookings/" + booking.getId())
                            .session(createAuthSession(playerUser1)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("confirmed"))
                    .andExpect(jsonPath("$.data.qrTicket.ref").isString())
                    .andExpect(jsonPath("$.data.qrCodeUrl").isString())
                    .andExpect(jsonPath("$.data.payment.status").value("verified"))
                    .andExpect(jsonPath("$.data.paymentVerification.status").value("approved"));
        }

        @Test
        @DisplayName("Owner rejects payment: booking marked rejected and slot becomes available again")
        void ownerRejectsPayment() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            var booking = bookingService.createBooking(playerUser1.getId(), req);

            bookingService.submitPayment(playerUser1.getId(), booking.getId(), "123456789012", null, "https://storage.slotplay.in/proof.png");

            // Owner rejects with reason
            mockMvc.perform(post("/api/bookings/" + booking.getId() + "/verify")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new VerifyPaymentRequest(false, "UTR number not found in bank statement"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Payment rejected. User has been notified."));

            Booking rejected = bookingRepository.findById(booking.getId()).orElseThrow();
            assertEquals("rejected", rejected.getStatus());

            // Slot is available again
            assertTrue(slotService.isSlotAvailable(slot.getId()));
        }

        @Test
        @DisplayName("User listing bookings with status filter (e.g. status=awaiting_payment or status=confirmed)")
        void listUserBookings() throws Exception {
            CreateBookingRequest req = new CreateBookingRequest(slot.getId(), venue.getId());
            bookingService.createBooking(playerUser1.getId(), req);

            // Filter status awaiting_payment (audit item 7.6)
            mockMvc.perform(get("/api/bookings")
                            .session(createAuthSession(playerUser1))
                            .param("status", "awaiting_payment"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.data", hasSize(1)))
                    .andExpect(jsonPath("$.data.data[0].status").value("pending_payment"));

            // Filter confirmed (should be empty)
            mockMvc.perform(get("/api/bookings")
                            .session(createAuthSession(playerUser1))
                            .param("status", "confirmed"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data", hasSize(0)));
        }
    }
}
