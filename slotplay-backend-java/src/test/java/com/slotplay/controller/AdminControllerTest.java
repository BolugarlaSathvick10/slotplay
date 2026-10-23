package com.slotplay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.CreateBookingRequest;
import com.slotplay.dto.UpdateVenueStatusRequest;
import com.slotplay.dto.VerifyPaymentRequest;
import com.slotplay.entity.*;
import com.slotplay.repository.*;
import com.slotplay.security.UserPrincipal;
import com.slotplay.service.BookingService;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AdminControllerTest {

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
    private BookingService bookingService;

    private User adminUser;
    private User ownerUser;
    private User playerUser;
    private Venue venue;

    @BeforeEach
    void setUp() {
        Role adminRole = roleRepository.findByName("admin")
                .orElseGet(() -> roleRepository.save(new Role("admin")));
        Role ownerRole = roleRepository.findByName("owner")
                .orElseGet(() -> roleRepository.save(new Role("owner")));
        Role playerRole = roleRepository.findByName("user")
                .orElseGet(() -> roleRepository.save(new Role("user")));

        adminUser = new User();
        adminUser.setName("Super Admin");
        adminUser.setEmail("admin." + UUID.randomUUID() + "@slotplay.in");
        adminUser.setPasswordHash("hashed_pwd");
        adminUser.setRole(adminRole);
        adminUser.setVerified(true);
        adminUser = userRepository.save(adminUser);

        ownerUser = new User();
        ownerUser.setName("Venue Owner");
        ownerUser.setEmail("owner." + UUID.randomUUID() + "@slotplay.in");
        ownerUser.setPasswordHash("hashed_pwd");
        ownerUser.setRole(ownerRole);
        ownerUser.setVerified(true);
        ownerUser = userRepository.save(ownerUser);

        playerUser = new User();
        playerUser.setName("Player User");
        playerUser.setEmail("player." + UUID.randomUUID() + "@slotplay.in");
        playerUser.setPasswordHash("hashed_pwd");
        playerUser.setRole(playerRole);
        playerUser.setVerified(true);
        playerUser = userRepository.save(playerUser);

        Sport sport = sportRepository.findByName("Football")
                .orElseGet(() -> sportRepository.save(new Sport("Football", "https://slotplay.in/football.svg")));

        venue = new Venue();
        venue.setOwner(ownerUser);
        venue.setSport(sport);
        venue.setName("FIFA Arena");
        venue.setAddress("Koramangala");
        venue.setCity("Bengaluru");
        venue.setState("Karnataka");
        venue.setPincode("560034");
        venue.setPricePerHour(BigDecimal.valueOf(1800.00));
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

    @Test
    @DisplayName("Admin reports: Successfully aggregates users, venues, bookings, and verified revenue")
    void testAdminReportsAggregations() throws Exception {
        // Create slot and confirmed booking with verified payment
        Slot slot = slotRepository.save(new Slot(
                venue,
                LocalDate.parse("2026-11-28"),
                LocalTime.of(10, 0),
                LocalTime.of(11, 0),
                BigDecimal.valueOf(1800.00),
                "available"
        ));

        var booking = bookingService.createBooking(playerUser.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));
        bookingService.submitPayment(playerUser.getId(), booking.getId(), "123456789012", null, "https://storage.slotplay.in/shot.png");
        bookingService.verifyPayment(ownerUser.getId(), false, booking.getId(), new VerifyPaymentRequest(true, null));

        mockMvc.perform(get("/api/admin/reports")
                        .session(createAuthSession(adminUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Reports"))
                .andExpect(jsonPath("$.data.users", greaterThanOrEqualTo(3)))
                .andExpect(jsonPath("$.data.venues", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.bookings", greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.revenue", greaterThanOrEqualTo(1800.0)));
    }

    @Test
    @DisplayName("Unauthorized / Forbidden checks for /api/admin/reports")
    void testAdminReportsPermissions() throws Exception {
        // Unauthenticated -> 401
        mockMvc.perform(get("/api/admin/reports"))
                .andExpect(status().isUnauthorized());

        // Player -> 403
        mockMvc.perform(get("/api/admin/reports")
                        .session(createAuthSession(playerUser)))
                .andExpect(status().isForbidden());

        // Owner -> 403
        mockMvc.perform(get("/api/admin/reports")
                        .session(createAuthSession(ownerUser)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Admin updates venue status to suspended, then back to active")
    void testAdminUpdateVenueStatus() throws Exception {
        // Suspend
        mockMvc.perform(patch("/api/admin/venues/" + venue.getId())
                        .session(createAuthSession(adminUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateVenueStatusRequest(false))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Venue updated"))
                .andExpect(jsonPath("$.data.id").value(venue.getId().toString()))
                .andExpect(jsonPath("$.data.status").value("suspended"));

        Venue suspended = venueRepository.findById(venue.getId()).orElseThrow();
        assertEquals("suspended", suspended.getStatus());

        // Activate
        mockMvc.perform(patch("/api/admin/venues/" + venue.getId())
                        .session(createAuthSession(adminUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateVenueStatusRequest(true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Venue updated"))
                .andExpect(jsonPath("$.data.status").value("active"));

        Venue active = venueRepository.findById(venue.getId()).orElseThrow();
        assertEquals("active", active.getStatus());
    }

    @Test
    @DisplayName("Venue status update fails if non-admin or venue not found")
    void testAdminUpdateVenueStatusErrors() throws Exception {
        // Player forbidden -> 403
        mockMvc.perform(patch("/api/admin/venues/" + venue.getId())
                        .session(createAuthSession(playerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateVenueStatusRequest(false))))
                .andExpect(status().isForbidden());

        // Unauthenticated -> 401
        mockMvc.perform(patch("/api/admin/venues/" + venue.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateVenueStatusRequest(false))))
                .andExpect(status().isUnauthorized());

        // Non-existent venue -> 404
        mockMvc.perform(patch("/api/admin/venues/" + UUID.randomUUID())
                        .session(createAuthSession(adminUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateVenueStatusRequest(false))))
                .andExpect(status().isNotFound());
    }
}
