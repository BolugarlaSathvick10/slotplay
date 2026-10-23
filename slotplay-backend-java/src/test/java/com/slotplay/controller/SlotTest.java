package com.slotplay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.CreateSlotRequest;
import com.slotplay.dto.GenerateSlotsRequest;
import com.slotplay.entity.*;
import com.slotplay.exception.AppException;
import com.slotplay.repository.*;
import com.slotplay.security.UserPrincipal;
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
class SlotTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private SlotService slotService;

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
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PaymentVerificationRepository paymentVerificationRepository;

    private User ownerUser;
    private User otherOwnerUser;
    private User playerUser;
    private Venue venue;

    @BeforeEach
    void setUp() {
        Role ownerRole = roleRepository.findByName("owner")
                .orElseGet(() -> roleRepository.save(new Role("owner")));
        Role playerRole = roleRepository.findByName("user")
                .orElseGet(() -> roleRepository.save(new Role("user")));

        ownerUser = new User();
        ownerUser.setName("Slot Owner");
        ownerUser.setEmail("slot.owner." + UUID.randomUUID() + "@slotplay.in");
        ownerUser.setPasswordHash("hashed_pass");
        ownerUser.setRole(ownerRole);
        ownerUser.setVerified(true);
        ownerUser.setPhone("9876543220");
        ownerUser = userRepository.save(ownerUser);

        otherOwnerUser = new User();
        otherOwnerUser.setName("Other Slot Owner");
        otherOwnerUser.setEmail("other.owner." + UUID.randomUUID() + "@slotplay.in");
        otherOwnerUser.setPasswordHash("hashed_pass");
        otherOwnerUser.setRole(ownerRole);
        otherOwnerUser.setVerified(true);
        otherOwnerUser.setPhone("9876543221");
        otherOwnerUser = userRepository.save(otherOwnerUser);

        playerUser = new User();
        playerUser.setName("Slot Player");
        playerUser.setEmail("slot.player." + UUID.randomUUID() + "@slotplay.in");
        playerUser.setPasswordHash("hashed_pass");
        playerUser.setRole(playerRole);
        playerUser.setVerified(true);
        playerUser.setPhone("9876543222");
        playerUser = userRepository.save(playerUser);

        Sport sport = sportRepository.findByName("Cricket")
                .orElseGet(() -> sportRepository.save(new Sport("Cricket", "https://slotplay.in/cricket.svg")));

        venue = new Venue();
        venue.setOwner(ownerUser);
        venue.setSport(sport);
        venue.setName("Grand Arena Turf");
        venue.setAddress("Banjara Hills");
        venue.setCity("Hyderabad");
        venue.setState("Telangana");
        venue.setPincode("500034");
        venue.setPricePerHour(BigDecimal.valueOf(1000.00));
        venue.setStatus("active");
        venue.setVerified(true);
        venue = venueRepository.save(venue);
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
    @DisplayName("Availability Queries Tests")
    class AvailabilityQueriesTests {

        @Test
        @DisplayName("Querying date with no prior slots auto-generates 16 default hourly slots (06:00 to 22:00)")
        void autoGenerateDefaultHourlySlots() throws Exception {
            String testDate = "2026-11-01";

            mockMvc.perform(get("/api/venues/" + venue.getId() + "/slots")
                            .param("date", testDate))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Slots retrieved successfully"))
                    .andExpect(jsonPath("$.data", hasSize(16)))
                    .andExpect(jsonPath("$.data[0].startTime").value("06:00"))
                    .andExpect(jsonPath("$.data[0].endTime").value("07:00"))
                    .andExpect(jsonPath("$.data[0].isAvailable").value(true))
                    .andExpect(jsonPath("$.data[0].bookingStatus").isEmpty())
                    .andExpect(jsonPath("$.data[15].startTime").value("21:00"))
                    .andExpect(jsonPath("$.data[15].endTime").value("22:00"))
                    .andExpect(jsonPath("$.data[15].isAvailable").value(true));

            // Verify persisted in database
            assertEquals(16, slotRepository.countByVenueIdAndDate(venue.getId(), LocalDate.parse(testDate)));
        }

        @Test
        @DisplayName("Active booking (pending_payment, pending_verification, confirmed) marks slot unavailable")
        void activeBookingsMarkSlotUnavailable() throws Exception {
            String testDate = "2026-11-02";
            LocalDate date = LocalDate.parse(testDate);

            // Create initial slot
            Slot slot = new Slot(venue, date, LocalTime.of(10, 0), LocalTime.of(11, 0), BigDecimal.valueOf(1000), "available");
            slot = slotRepository.save(slot);

            // Initially available
            assertTrue(slotService.isSlotAvailable(slot.getId()));

            // Attach active booking in pending_payment
            Booking booking = new Booking(playerUser, slot, venue, "BK-TEST-001", BigDecimal.valueOf(1000), "pending_payment");
            bookingRepository.save(booking);

            // Slot is no longer available
            assertFalse(slotService.isSlotAvailable(slot.getId()));

            mockMvc.perform(get("/api/venues/" + venue.getId() + "/slots")
                            .param("date", testDate))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].startTime").value("10:00"))
                    .andExpect(jsonPath("$.data[0].isAvailable").value(false))
                    .andExpect(jsonPath("$.data[0].bookingStatus").value("pending_payment"));

            // Update booking to pending_verification
            booking.setStatus("pending_verification");
            bookingRepository.save(booking);
            assertFalse(slotService.isSlotAvailable(slot.getId()));

            // Update booking to confirmed
            booking.setStatus("confirmed");
            bookingRepository.save(booking);
            assertFalse(slotService.isSlotAvailable(slot.getId()));
        }

        @Test
        @DisplayName("Cancelled or rejected booking restores slot availability")
        void cancelledBookingLeavesSlotAvailable() throws Exception {
            String testDate = "2026-11-03";
            LocalDate date = LocalDate.parse(testDate);

            Slot slot = new Slot(venue, date, LocalTime.of(14, 0), LocalTime.of(15, 0), BigDecimal.valueOf(1000), "available");
            slot = slotRepository.save(slot);

            Booking cancelledBooking = new Booking(playerUser, slot, venue, "BK-TEST-CANCELLED", BigDecimal.valueOf(1000), "cancelled");
            bookingRepository.save(cancelledBooking);

            assertTrue(slotService.isSlotAvailable(slot.getId()));

            mockMvc.perform(get("/api/venues/" + venue.getId() + "/slots")
                            .param("date", testDate))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data[0].startTime").value("14:00"))
                    .andExpect(jsonPath("$.data[0].isAvailable").value(true))
                    .andExpect(jsonPath("$.data[0].bookingStatus").isEmpty());
        }
    }

    @Nested
    @DisplayName("Invalid Times Tests")
    class InvalidTimesTests {

        @Test
        @DisplayName("Missing date query parameter returns 400 MISSING_PARAM")
        void missingDateQuery() throws Exception {
            mockMvc.perform(get("/api/venues/" + venue.getId() + "/slots"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("MISSING_PARAM"))
                    .andExpect(jsonPath("$.message").value("date query parameter is required (YYYY-MM-DD)"));
        }

        @Test
        @DisplayName("Invalid date format returns 400 INVALID_DATE")
        void invalidDateFormatQuery() throws Exception {
            mockMvc.perform(get("/api/venues/" + venue.getId() + "/slots").param("date", "2026/11/01"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_DATE"))
                    .andExpect(jsonPath("$.message").value("date must be in YYYY-MM-DD format"));
        }

        @Test
        @DisplayName("Bulk slot generation with openHour >= closeHour returns 400 INVALID_TIME_RANGE")
        void invalidOpenCloseHour() throws Exception {
            GenerateSlotsRequest req = new GenerateSlotsRequest();
            req.setVenueId(venue.getId());
            req.setFromDate("2026-11-10");
            req.setToDate("2026-11-10");
            req.setOpenHour(20);
            req.setCloseHour(10); // close before open

            mockMvc.perform(post("/api/owner/slots/generate")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_TIME_RANGE"));
        }

        @Test
        @DisplayName("Bulk slot generation with non-positive slotDurationMinutes returns 400 INVALID_DURATION")
        void invalidDuration() throws Exception {
            GenerateSlotsRequest req = new GenerateSlotsRequest();
            req.setVenueId(venue.getId());
            req.setFromDate("2026-11-10");
            req.setToDate("2026-11-10");
            req.setSlotDurationMinutes(0);

            mockMvc.perform(post("/api/owner/slots/generate")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_DURATION"));
        }

        @Test
        @DisplayName("Bulk slot generation with fromDate after toDate returns 400 INVALID_DATE_RANGE")
        void invalidDateRange() throws Exception {
            GenerateSlotsRequest req = new GenerateSlotsRequest();
            req.setVenueId(venue.getId());
            req.setFromDate("2026-11-15");
            req.setToDate("2026-11-10");

            mockMvc.perform(post("/api/owner/slots/generate")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_DATE_RANGE"));
        }

        @Test
        @DisplayName("Creating single slot with start time after end time throws 400 INVALID_TIME")
        void createSlotStartTimeAfterEndTime() {
            CreateSlotRequest req = new CreateSlotRequest(
                    LocalDate.parse("2026-11-10"),
                    LocalTime.of(15, 0),
                    LocalTime.of(14, 0),
                    BigDecimal.valueOf(1000),
                    "available"
            );

            AppException ex = assertThrows(AppException.class, () ->
                    slotService.createSlot(venue.getId(), ownerUser.getId(), false, req)
            );
            assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
            assertEquals("INVALID_TIME", ex.getCode());
        }
    }

    @Nested
    @DisplayName("Overlapping Slots Protection Tests")
    class OverlappingSlotsTests {

        @Test
        @DisplayName("Creating single slot that overlaps an existing slot on same date throws 409 Conflict (SLOT_OVERLAP)")
        void rejectOverlappingSingleSlot() {
            LocalDate date = LocalDate.parse("2026-11-20");

            // Create initial slot 10:00 to 11:00
            CreateSlotRequest initial = new CreateSlotRequest(
                    date,
                    LocalTime.of(10, 0),
                    LocalTime.of(11, 0),
                    BigDecimal.valueOf(1000),
                    "available"
            );
            slotService.createSlot(venue.getId(), ownerUser.getId(), false, initial);

            // Test partial overlap (10:30 to 11:30)
            CreateSlotRequest partialOverlap = new CreateSlotRequest(
                    date,
                    LocalTime.of(10, 30),
                    LocalTime.of(11, 30),
                    BigDecimal.valueOf(1000),
                    "available"
            );
            AppException ex1 = assertThrows(AppException.class, () ->
                    slotService.createSlot(venue.getId(), ownerUser.getId(), false, partialOverlap)
            );
            assertEquals(HttpStatus.CONFLICT, ex1.getStatus());
            assertEquals("SLOT_OVERLAP", ex1.getCode());

            // Test enclosing overlap (09:30 to 11:30)
            CreateSlotRequest enclosingOverlap = new CreateSlotRequest(
                    date,
                    LocalTime.of(9, 30),
                    LocalTime.of(11, 30),
                    BigDecimal.valueOf(1000),
                    "available"
            );
            AppException ex2 = assertThrows(AppException.class, () ->
                    slotService.createSlot(venue.getId(), ownerUser.getId(), false, enclosingOverlap)
            );
            assertEquals(HttpStatus.CONFLICT, ex2.getStatus());
            assertEquals("SLOT_OVERLAP", ex2.getCode());

            // Test non-overlapping adjacent slot (11:00 to 12:00) -> succeeds!
            CreateSlotRequest adjacent = new CreateSlotRequest(
                    date,
                    LocalTime.of(11, 0),
                    LocalTime.of(12, 0),
                    BigDecimal.valueOf(1000),
                    "available"
            );
            assertDoesNotThrow(() ->
                    slotService.createSlot(venue.getId(), ownerUser.getId(), false, adjacent)
            );
        }

        @Test
        @DisplayName("Bulk slot generation skips overlapping slots cleanly so only non-overlapping slots are generated")
        void bulkGenerationSkipsOverlappingSlots() throws Exception {
            String testDate = "2026-11-21";
            LocalDate date = LocalDate.parse(testDate);

            // Pre-create slot at 06:00 to 07:00
            Slot existingSlot = new Slot(venue, date, LocalTime.of(6, 0), LocalTime.of(7, 0), BigDecimal.valueOf(1000), "available");
            slotRepository.save(existingSlot);

            GenerateSlotsRequest req = new GenerateSlotsRequest();
            req.setVenueId(venue.getId());
            req.setFromDate(testDate);
            req.setToDate(testDate);
            req.setOpenHour(6);
            req.setCloseHour(9); // would create 06-07, 07-08, 08-09
            req.setSlotDurationMinutes(60);

            // Perform bulk generation
            mockMvc.perform(post("/api/owner/slots/generate")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    // Only 2 new slots generated because 06:00-07:00 was skipped
                    .andExpect(jsonPath("$.data", hasSize(2)))
                    .andExpect(jsonPath("$.message").value("Generated 2 slots"));

            // Total slots for the date should be 3 (1 pre-existing + 2 newly generated)
            assertEquals(3, slotRepository.countByVenueIdAndDate(venue.getId(), date));
        }
    }

    @Nested
    @DisplayName("Unauthorized Edits Tests")
    class UnauthorizedEditsTests {

        @Test
        @DisplayName("Non-owner attempting to generate slots for a venue returns 403 FORBIDDEN")
        void nonOwnerCannotGenerateSlots() throws Exception {
            GenerateSlotsRequest req = new GenerateSlotsRequest();
            req.setVenueId(venue.getId());
            req.setFromDate("2026-11-25");
            req.setToDate("2026-11-25");

            mockMvc.perform(post("/api/owner/slots/generate")
                            .session(createAuthSession(otherOwnerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.message").value("You do not own this venue"));
        }

        @Test
        @DisplayName("Player attempting to generate slots returns 403 FORBIDDEN")
        void playerCannotGenerateSlots() throws Exception {
            GenerateSlotsRequest req = new GenerateSlotsRequest();
            req.setVenueId(venue.getId());
            req.setFromDate("2026-11-25");
            req.setToDate("2026-11-25");

            mockMvc.perform(post("/api/owner/slots/generate")
                            .session(createAuthSession(playerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }

        @Test
        @DisplayName("Direct createSlot by non-owner throws 403 FORBIDDEN")
        void directCreateSlotUnauthorized() {
            CreateSlotRequest req = new CreateSlotRequest(
                    LocalDate.parse("2026-11-25"),
                    LocalTime.of(9, 0),
                    LocalTime.of(10, 0),
                    BigDecimal.valueOf(1000),
                    "available"
            );

            AppException ex = assertThrows(AppException.class, () ->
                    slotService.createSlot(venue.getId(), otherOwnerUser.getId(), false, req)
            );
            assertEquals(HttpStatus.FORBIDDEN, ex.getStatus());
            assertEquals("FORBIDDEN", ex.getCode());
        }
    }

    @Nested
    @DisplayName("Concurrent Conflicting Slot Creation Protection")
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    class ConcurrencyProtectionTests {

        @org.junit.jupiter.api.AfterEach
        void cleanUp() {
            paymentVerificationRepository.deleteAll();
            paymentRepository.deleteAll();
            bookingRepository.deleteAll();
            slotRepository.deleteAll();
            venueRepository.delete(venue);
            userRepository.delete(ownerUser);
            userRepository.delete(otherOwnerUser);
            userRepository.delete(playerUser);
        }

        @Test
        @DisplayName("Multiple threads concurrently generating slots for the same date must not create conflicting duplicates")
        void testConcurrentSlotGeneration() throws InterruptedException, ExecutionException {
            String testDate = "2026-12-01";
            LocalDate date = LocalDate.parse(testDate);

            int numThreads = 5;
            ExecutorService executor = Executors.newFixedThreadPool(numThreads);
            CountDownLatch readyLatch = new CountDownLatch(numThreads);
            CountDownLatch startLatch = new CountDownLatch(1);

            List<Future<List<?>>> futures = new ArrayList<>();

            for (int i = 0; i < numThreads; i++) {
                futures.add(executor.submit(() -> {
                    readyLatch.countDown();
                    startLatch.await(); // Synchronize all threads to fire simultaneously

                    GenerateSlotsRequest req = new GenerateSlotsRequest();
                    req.setVenueId(venue.getId());
                    req.setFromDate(testDate);
                    req.setToDate(testDate);
                    req.setOpenHour(8);
                    req.setCloseHour(12); // 4 slots: 08-09, 09-10, 10-11, 11-12
                    req.setSlotDurationMinutes(60);

                    return slotService.generateSlots(venue.getId(), ownerUser.getId(), false, req);
                }));
            }

            readyLatch.await();
            startLatch.countDown(); // Fire!

            int totalCreatedAcrossThreads = 0;
            for (Future<List<?>> future : futures) {
                totalCreatedAcrossThreads += future.get().size();
            }

            executor.shutdown();
            assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));

            // Verify exactly 4 slots exist for this venue and date in the repository (no duplicates!)
            List<Slot> finalSlots = slotRepository.findByVenueIdAndDateOrderByStartTimeAsc(venue.getId(), date);
            assertEquals(4, finalSlots.size(), "Exactly 4 unique slots should exist without any duplicates or corruption");
            assertEquals(4, totalCreatedAcrossThreads, "First thread should have created 4, subsequent concurrent threads skipped them");

            assertEquals(LocalTime.of(8, 0), finalSlots.get(0).getStartTime());
            assertEquals(LocalTime.of(9, 0), finalSlots.get(1).getStartTime());
            assertEquals(LocalTime.of(10, 0), finalSlots.get(2).getStartTime());
            assertEquals(LocalTime.of(11, 0), finalSlots.get(3).getStartTime());
        }
    }
}
