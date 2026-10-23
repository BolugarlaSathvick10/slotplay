package com.slotplay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.CreateBookingRequest;
import com.slotplay.dto.SubmitReviewRequest;
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
class ReviewTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BookingService bookingService;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private SlotRepository slotRepository;

    @Autowired
    private SportRepository sportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    private User ownerUser;
    private User playerWithBooking;
    private User playerWithoutBooking;
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
        ownerUser = userRepository.save(ownerUser);

        playerWithBooking = new User();
        playerWithBooking.setName("Rahul Dravid");
        playerWithBooking.setEmail("rahul." + UUID.randomUUID() + "@slotplay.in");
        playerWithBooking.setPasswordHash("hashed_pass");
        playerWithBooking.setRole(playerRole);
        playerWithBooking.setVerified(true);
        playerWithBooking = userRepository.save(playerWithBooking);

        playerWithoutBooking = new User();
        playerWithoutBooking.setName("Random Visitor");
        playerWithoutBooking.setEmail("random." + UUID.randomUUID() + "@slotplay.in");
        playerWithoutBooking.setPasswordHash("hashed_pass");
        playerWithoutBooking.setRole(playerRole);
        playerWithoutBooking.setVerified(true);
        playerWithoutBooking = userRepository.save(playerWithoutBooking);

        Sport sport = sportRepository.findByName("Cricket")
                .orElseGet(() -> sportRepository.save(new Sport("Cricket", "https://slotplay.in/cricket.svg")));

        venue = new Venue();
        venue.setOwner(ownerUser);
        venue.setSport(sport);
        venue.setName("Lords Turf");
        venue.setAddress("Banjara Hills");
        venue.setCity("Hyderabad");
        venue.setState("Telangana");
        venue.setPincode("500034");
        venue.setPricePerHour(BigDecimal.valueOf(1400.00));
        venue.setStatus("active");
        venue.setVerified(true);
        venue = venueRepository.save(venue);

        slot = new Slot(
                venue,
                LocalDate.parse("2026-11-25"),
                LocalTime.of(17, 0),
                LocalTime.of(18, 0),
                BigDecimal.valueOf(1400.00),
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

    private void createConfirmedBooking(User player) {
        var booking = bookingService.createBooking(player.getId(), new CreateBookingRequest(slot.getId(), venue.getId()));
        bookingService.submitPayment(player.getId(), booking.getId(), "987654321012", null, "https://storage.slotplay.in/shot.png");
        bookingService.verifyPayment(ownerUser.getId(), false, booking.getId(), new VerifyPaymentRequest(true, null));
    }

    @Test
    @DisplayName("Success: User with confirmed booking submits review (201 Created)")
    void testUserWithConfirmedBookingSubmitsReview() throws Exception {
        createConfirmedBooking(playerWithBooking);

        SubmitReviewRequest reviewReq = new SubmitReviewRequest(venue.getId(), 5, "Fantastic pitch and floodlights!");

        mockMvc.perform(post("/api/venues/reviews")
                        .session(createAuthSession(playerWithBooking))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Review submitted successfully"))
                .andExpect(jsonPath("$.data.rating").value(5))
                .andExpect(jsonPath("$.data.comment").value("Fantastic pitch and floodlights!"))
                .andExpect(jsonPath("$.data.user.name").value("Rahul Dravid"));

        // Verify venue metrics updated
        Venue updatedVenue = venueRepository.findById(venue.getId()).orElseThrow();
        assertEquals(1, updatedVenue.getTotalReviews());
        assertEquals(0, BigDecimal.valueOf(5.0).compareTo(updatedVenue.getAvgRating()));
    }

    @Test
    @DisplayName("Success: User updates existing review on subsequent submit")
    void testUserUpdatesExistingReview() throws Exception {
        createConfirmedBooking(playerWithBooking);

        SubmitReviewRequest initialReq = new SubmitReviewRequest(venue.getId(), 4, "Good experience");
        mockMvc.perform(post("/api/venues/reviews")
                        .session(createAuthSession(playerWithBooking))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(initialReq)))
                .andExpect(status().isCreated());

        SubmitReviewRequest updatedReq = new SubmitReviewRequest(venue.getId(), 5, "Updated: Absolutely top notch!");
        mockMvc.perform(post("/api/venues/reviews")
                        .session(createAuthSession(playerWithBooking))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updatedReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.rating").value(5))
                .andExpect(jsonPath("$.data.comment").value("Updated: Absolutely top notch!"));

        // Still only 1 review
        assertEquals(1, reviewRepository.findByVenueIdOrderByCreatedAtDesc(venue.getId()).size());
    }

    @Test
    @DisplayName("Unauthorized: User with NO confirmed booking cannot review (returns 403 NO_BOOKING)")
    void testUserWithoutConfirmedBookingCannotReview() throws Exception {
        SubmitReviewRequest reviewReq = new SubmitReviewRequest(venue.getId(), 5, "I never booked but want to review");

        mockMvc.perform(post("/api/venues/reviews")
                        .session(createAuthSession(playerWithoutBooking))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reviewReq)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("NO_BOOKING"))
                .andExpect(jsonPath("$.message").value("You can only review venues where you have a confirmed booking"));
    }

    @Test
    @DisplayName("Validation: Rating out of bounds (<1 or >5) returns 422 Unprocessable Entity")
    void testInvalidRatingRejected() throws Exception {
        createConfirmedBooking(playerWithBooking);

        SubmitReviewRequest invalidLow = new SubmitReviewRequest(venue.getId(), 0, "Too low");
        mockMvc.perform(post("/api/venues/reviews")
                        .session(createAuthSession(playerWithBooking))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidLow)))
                .andExpect(status().isUnprocessableEntity());

        SubmitReviewRequest invalidHigh = new SubmitReviewRequest(venue.getId(), 6, "Too high");
        mockMvc.perform(post("/api/venues/reviews")
                        .session(createAuthSession(playerWithBooking))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidHigh)))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("Public Listing: Venue reviews retrieved with sorting (recent, rating-high, rating-low)")
    void testListVenueReviews() throws Exception {
        reviewRepository.save(new Review(playerWithBooking, venue, 3, "Average"));
        reviewRepository.save(new Review(playerWithoutBooking, venue, 5, "Excellent"));

        // Sort recent
        mockMvc.perform(get("/api/venues/" + venue.getId() + "/reviews")
                        .param("sortBy", "recent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.data", hasSize(2)));

        // Sort rating-high
        mockMvc.perform(get("/api/venues/" + venue.getId() + "/reviews")
                        .param("sortBy", "rating-high"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data[0].rating").value(5))
                .andExpect(jsonPath("$.data.data[1].rating").value(3));

        // Sort rating-low
        mockMvc.perform(get("/api/venues/" + venue.getId() + "/reviews")
                        .param("sortBy", "rating-low"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data[0].rating").value(3))
                .andExpect(jsonPath("$.data.data[1].rating").value(5));
    }
}
