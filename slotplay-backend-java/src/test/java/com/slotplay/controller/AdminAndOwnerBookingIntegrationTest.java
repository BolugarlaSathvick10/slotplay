package com.slotplay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.CreateBookingRequest;
import com.slotplay.dto.VerifyPaymentRequest;
import com.slotplay.entity.*;
import com.slotplay.repository.*;
import com.slotplay.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AdminAndOwnerBookingIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private SportRepository sportRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private User player;
    private User owner;
    private User admin;
    private Venue venue;
    private Slot slot;

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

    @BeforeEach
    void setUp() {
        Role userRole = roleRepository.findByName("user").orElseGet(() -> roleRepository.save(new Role("user")));
        Role ownerRole = roleRepository.findByName("owner").orElseGet(() -> roleRepository.save(new Role("owner")));
        Role adminRole = roleRepository.findByName("admin").orElseGet(() -> roleRepository.save(new Role("admin")));

        player = new User();
        player.setName("Integration Player");
        player.setEmail("player." + UUID.randomUUID() + "@slotplay.in");
        player.setPasswordHash("hashed_pass");
        player.setRole(userRole);
        player.setVerified(true);
        player.setPhone("9876540001");
        player = userRepository.save(player);

        owner = new User();
        owner.setName("Integration Owner");
        owner.setEmail("owner." + UUID.randomUUID() + "@slotplay.in");
        owner.setPasswordHash("hashed_pass");
        owner.setRole(ownerRole);
        owner.setVerified(true);
        owner.setPhone("9876540002");
        owner = userRepository.save(owner);

        admin = new User();
        admin.setName("Integration Admin");
        admin.setEmail("admin." + UUID.randomUUID() + "@slotplay.in");
        admin.setPasswordHash("hashed_pass");
        admin.setRole(adminRole);
        admin.setVerified(true);
        admin.setPhone("9876540003");
        admin = userRepository.save(admin);

        Sport cricket = sportRepository.findByName("Cricket")
                .orElseGet(() -> sportRepository.save(new Sport("Cricket", "https://slotplay.in/cricket.svg")));

        venue = new Venue();
        venue.setOwner(owner);
        venue.setSport(cricket);
        venue.setName("Integration Turf " + UUID.randomUUID().toString().substring(0, 5));
        venue.setAddress("Ring Road");
        venue.setCity("Hyderabad");
        venue.setState("Telangana");
        venue.setPincode("500032");
        venue.setPricePerHour(BigDecimal.valueOf(1200.00));
        venue.setStatus("active");
        venue.setVerified(true);
        venue = venueRepository.save(venue);

        slot = new Slot(
                venue,
                LocalDate.now().plusDays(2),
                LocalTime.of(18, 0),
                LocalTime.of(19, 0),
                BigDecimal.valueOf(1200.00),
                "available"
        );
        slot = slotRepository.save(slot);
    }

    @Test
    @DisplayName("Complete Flow: Booking reflects in owner and admin dashboards, confirm payment marks booked & generates QR")
    void testBookingReflectsAndCanBeConfirmedWithQr() throws Exception {
        MockHttpSession playerSession = createAuthSession(player);
        MockHttpSession ownerSession = createAuthSession(owner);
        MockHttpSession adminSession = createAuthSession(admin);

        // 1. Player creates booking
        CreateBookingRequest createReq = new CreateBookingRequest(slot.getId(), venue.getId());

        String bookingJson = mockMvc.perform(post("/api/bookings")
                        .session(playerSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("pending_payment"))
                .andExpect(jsonPath("$.data.bookingRef").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        String bookingIdStr = objectMapper.readTree(bookingJson).get("data").get("id").asText();
        String bookingRef = objectMapper.readTree(bookingJson).get("data").get("bookingRef").asText();
        UUID bookingId = UUID.fromString(bookingIdStr);

        // 2. Owner checks their turf bookings - the new booking is immediately visible!
        mockMvc.perform(get("/api/owner/bookings").session(ownerSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.data[?(@.id == '" + bookingIdStr + "')]").exists());

        // 3. Admin checks all bookings - the booking is immediately visible!
        mockMvc.perform(get("/api/admin/bookings").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.data[?(@.id == '" + bookingIdStr + "')]").exists());

        // 4. Confirm payment by owner directly ("Payment Received / Verified")
        VerifyPaymentRequest verifyReq = new VerifyPaymentRequest(true, null);

        mockMvc.perform(post("/api/bookings/" + bookingId + "/verify")
                        .session(ownerSession)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(verifyReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message", containsString("Payment verified")));

        // 5. Verify in DB: booking is confirmed, slot is booked, and QR code URL is set
        Booking confirmedBooking = bookingRepository.findById(bookingId).orElseThrow();
        assertEquals("confirmed", confirmedBooking.getStatus());
        Slot updatedSlot = slotRepository.findById(slot.getId()).orElseThrow();
        assertEquals("booked", updatedSlot.getStatus());
        assertNotNull(confirmedBooking.getConfirmedAt());
        assertTrue(confirmedBooking.getQrCodeUrl().contains(bookingRef));

        Payment payment = paymentRepository.findByBookingId(bookingId).orElseThrow();
        assertEquals("verified", payment.getStatus());

        // 6. Check ticket endpoint returns confirmed ticket with QR ref
        mockMvc.perform(get("/api/bookings/ticket/" + bookingRef))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("confirmed"))
                .andExpect(jsonPath("$.data.bookingRef").value(bookingRef))
                .andExpect(jsonPath("$.data.qrCodeUrl", containsString(bookingRef)));
    }
}
