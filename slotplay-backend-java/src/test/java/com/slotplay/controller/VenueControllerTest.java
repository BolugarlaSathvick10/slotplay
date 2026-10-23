package com.slotplay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.CreateVenueRequest;
import com.slotplay.dto.UpdateVenueRequest;
import com.slotplay.entity.*;
import com.slotplay.repository.*;
import com.slotplay.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class VenueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private SportRepository sportRepository;

    @Autowired
    private AmenityRepository amenityRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private OwnerProfileRepository ownerProfileRepository;

    @Autowired
    private VenueImageRepository venueImageRepository;

    @Autowired
    private OwnerUpiQrRepository ownerUpiQrRepository;

    private User ownerUser;
    private User otherOwnerUser;
    private User playerUser;
    private Sport cricketSport;
    private Sport footballSport;
    private Amenity parkingAmenity;
    private Amenity wifiAmenity;
    private Venue primaryVenue;

    @BeforeEach
    void setUp() {
        Role ownerRole = roleRepository.findByName("owner")
                .orElseGet(() -> roleRepository.save(new Role("owner")));
        Role playerRole = roleRepository.findByName("user")
                .orElseGet(() -> roleRepository.save(new Role("user")));

        ownerUser = new User();
        ownerUser.setName("Rajesh Owner");
        ownerUser.setEmail("rajesh.owner." + UUID.randomUUID() + "@slotplay.in");
        ownerUser.setPasswordHash("hashed_pass");
        ownerUser.setRole(ownerRole);
        ownerUser.setVerified(true);
        ownerUser.setPhone("9876543210");
        ownerUser = userRepository.save(ownerUser);

        OwnerProfile ownerProfile = new OwnerProfile(ownerUser, "Rajesh Sports Arena Ltd", "36AABCU9603R1ZM", true);
        ownerProfileRepository.save(ownerProfile);

        otherOwnerUser = new User();
        otherOwnerUser.setName("Suresh Owner");
        otherOwnerUser.setEmail("suresh.owner." + UUID.randomUUID() + "@slotplay.in");
        otherOwnerUser.setPasswordHash("hashed_pass");
        otherOwnerUser.setRole(ownerRole);
        otherOwnerUser.setVerified(true);
        otherOwnerUser.setPhone("9876543211");
        otherOwnerUser = userRepository.save(otherOwnerUser);

        playerUser = new User();
        playerUser.setName("Pooja Player");
        playerUser.setEmail("pooja.player." + UUID.randomUUID() + "@slotplay.in");
        playerUser.setPasswordHash("hashed_pass");
        playerUser.setRole(playerRole);
        playerUser.setVerified(true);
        playerUser.setPhone("9876543212");
        playerUser = userRepository.save(playerUser);

        cricketSport = sportRepository.findByName("Cricket")
                .orElseGet(() -> sportRepository.save(new Sport("Cricket", "https://slotplay.in/icons/cricket.svg")));
        footballSport = sportRepository.findByName("Football")
                .orElseGet(() -> sportRepository.save(new Sport("Football", "https://slotplay.in/icons/football.svg")));

        parkingAmenity = amenityRepository.findByName("Parking")
                .orElseGet(() -> amenityRepository.save(new Amenity("Parking", "car")));
        wifiAmenity = amenityRepository.findByName("WiFi")
                .orElseGet(() -> amenityRepository.save(new Amenity("WiFi", "wifi")));

        primaryVenue = new Venue();
        primaryVenue.setOwner(ownerUser);
        primaryVenue.setSport(cricketSport);
        primaryVenue.setName("Apex Cricket Turf");
        primaryVenue.setDescription("Top-tier AstroTurf cricket pitch with LED floodlights");
        primaryVenue.setAddress("Plot 42, Jubilee Hills Road");
        primaryVenue.setCity("Hyderabad");
        primaryVenue.setState("Telangana");
        primaryVenue.setPincode("500033");
        primaryVenue.setLatitude(17.4319);
        primaryVenue.setLongitude(78.4073);
        primaryVenue.setPricePerHour(BigDecimal.valueOf(1200.00));
        primaryVenue.setPhone("9876543210");
        primaryVenue.setStatus("active");
        primaryVenue.setVerified(true);
        primaryVenue.getAmenities().add(parkingAmenity);
        primaryVenue.getAmenities().add(wifiAmenity);
        primaryVenue = venueRepository.save(primaryVenue);

        VenueImage img = new VenueImage(primaryVenue, "https://storage.slotplay.in/venues/apex-1.webp", "key1", true, 0);
        venueImageRepository.save(img);

        OwnerUpiQr upi = new OwnerUpiQr();
        upi.setOwner(ownerUser);
        upi.setVenue(primaryVenue);
        upi.setUpiId("apexarena@upi");
        upi.setQrImageUrl("https://storage.slotplay.in/qr/apex.png");
        upi.setActive(true);
        ownerUpiQrRepository.save(upi);

        Review review = new Review();
        review.setVenue(primaryVenue);
        review.setUser(playerUser);
        review.setRating(5);
        review.setComment("Incredible turf quality and lighting!");
        reviewRepository.save(review);
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
    @DisplayName("Venue Listing & Filtering Tests")
    class ListingTests {

        @Test
        @DisplayName("GET /api/venues should return paginated list with pagination metadata envelope")
        void listVenuesEnvelope() throws Exception {
            mockMvc.perform(get("/api/venues")
                            .param("page", "1")
                            .param("limit", "10"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Venues retrieved successfully"))
                    .andExpect(jsonPath("$.data.data", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.page").value(1))
                    .andExpect(jsonPath("$.data.limit").value(10))
                    .andExpect(jsonPath("$.data.total", greaterThanOrEqualTo(1)))
                    .andExpect(jsonPath("$.data.pages", greaterThanOrEqualTo(1)))
                    .andExpect(jsonPath("$.data.pagination.page").value(1))
                    .andExpect(jsonPath("$.data.pagination.limit").value(10));
        }

        @Test
        @DisplayName("Filter by city (Hyderabad) should include venue; non-matching city should exclude it")
        void filterByCity() throws Exception {
            mockMvc.perform(get("/api/venues").param("city", "Hyderabad"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.data[0].city").value("Hyderabad"));

            mockMvc.perform(get("/api/venues").param("city", "Mumbai"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data", hasSize(0)))
                    .andExpect(jsonPath("$.data.total").value(0));
        }

        @Test
        @DisplayName("Filter by sportId should match correctly")
        void filterBySportId() throws Exception {
            mockMvc.perform(get("/api/venues").param("sportId", cricketSport.getId().toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data.data[0].name").value("Apex Cricket Turf"));

            mockMvc.perform(get("/api/venues").param("sportId", footballSport.getId().toString()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data", hasSize(0)));
        }

        @Test
        @DisplayName("Filter by search term in name or description")
        void filterBySearch() throws Exception {
            mockMvc.perform(get("/api/venues").param("search", "AstroTurf"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data", hasSize(1)))
                    .andExpect(jsonPath("$.data.data[0].name").value("Apex Cricket Turf"));

            mockMvc.perform(get("/api/venues").param("search", "NonExistentTurfKeyword"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data", hasSize(0)));
        }

        @Test
        @DisplayName("Filter by Haversine distance: radius within 5km matches, radius within 0.5km far away excludes")
        void filterByDistance() throws Exception {
            // Coordinate ~1 km away from Jubilee Hills (17.4319, 78.4073)
            double closeLat = 17.4350;
            double closeLon = 78.4100;

            mockMvc.perform(get("/api/venues")
                            .param("latitude", String.valueOf(closeLat))
                            .param("longitude", String.valueOf(closeLon))
                            .param("radiusKm", "5.0"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data", hasSize(1)))
                    .andExpect(jsonPath("$.data.data[0].distance").isString());

            // Coordinate in Bengaluru (~500 km away)
            double farLat = 12.9716;
            double farLon = 77.5946;

            mockMvc.perform(get("/api/venues")
                            .param("latitude", String.valueOf(farLat))
                            .param("longitude", String.valueOf(farLon))
                            .param("radiusKm", "10.0"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data", hasSize(0)));
        }

        @Test
        @DisplayName("Sorting by price, rating, distance, and newest")
        void sortingVenues() throws Exception {
            // Create a cheaper second venue
            Venue cheapVenue = new Venue();
            cheapVenue.setOwner(ownerUser);
            cheapVenue.setSport(cricketSport);
            cheapVenue.setName("Budget Box Cricket");
            cheapVenue.setAddress("Madhapur");
            cheapVenue.setCity("Hyderabad");
            cheapVenue.setState("Telangana");
            cheapVenue.setPincode("500081");
            cheapVenue.setPricePerHour(BigDecimal.valueOf(600.00));
            cheapVenue.setStatus("active");
            cheapVenue.setVerified(true);
            venueRepository.save(cheapVenue);

            // Sort by price: cheapVenue (600) should appear first
            mockMvc.perform(get("/api/venues").param("sortBy", "price"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data[0].pricePerHour").value(600.0));

            // Sort by rating: primaryVenue (has 5.0 review) should appear first
            mockMvc.perform(get("/api/venues").param("sortBy", "rating"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.data[0].name").value("Apex Cricket Turf"));
        }
    }

    @Nested
    @DisplayName("Venue Detail & Lists Tests")
    class DetailAndListsTests {

        @Test
        @DisplayName("GET /api/venues/{id} returns comprehensive venue detail with images, owner, upiId, reviews")
        void getVenueDetailSuccess() throws Exception {
            mockMvc.perform(get("/api/venues/" + primaryVenue.getId()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.id").value(primaryVenue.getId().toString()))
                    .andExpect(jsonPath("$.data.name").value("Apex Cricket Turf"))
                    .andExpect(jsonPath("$.data.owner.businessName").value("Rajesh Sports Arena Ltd"))
                    .andExpect(jsonPath("$.data.owner.gstNumber").value("36AABCU9603R1ZM"))
                    .andExpect(jsonPath("$.data.upiId").value("apexarena@upi"))
                    .andExpect(jsonPath("$.data.qrImageUrl").value("https://storage.slotplay.in/qr/apex.png"))
                    .andExpect(jsonPath("$.data.images", hasSize(1)))
                    .andExpect(jsonPath("$.data.images[0].url").value("https://storage.slotplay.in/venues/apex-1.webp"))
                    .andExpect(jsonPath("$.data.reviews", hasSize(1)))
                    .andExpect(jsonPath("$.data.reviews[0].rating").value(5))
                    .andExpect(jsonPath("$.data.averageRating").value("5.0"))
                    .andExpect(jsonPath("$.data.reviewCount").value(1));
        }

        @Test
        @DisplayName("GET /api/venues/{id} for non-existent venue returns 404 NOT_FOUND")
        void getVenueDetailNotFound() throws Exception {
            mockMvc.perform(get("/api/venues/" + UUID.randomUUID()))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        }

        @Test
        @DisplayName("GET /api/venues/lists/sports returns sports list")
        void getSportsList() throws Exception {
            mockMvc.perform(get("/api/venues/lists/sports"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))));
        }

        @Test
        @DisplayName("GET /api/venues/lists/amenities returns amenities list")
        void getAmenitiesList() throws Exception {
            mockMvc.perform(get("/api/venues/lists/amenities"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(2))));
        }
    }

    @Nested
    @DisplayName("Venue Creation & Ownership Tests")
    class CreationAndEditTests {

        @Test
        @DisplayName("POST /api/venues: Owner successfully creates venue with status 201")
        void ownerCreatesVenue() throws Exception {
            CreateVenueRequest req = new CreateVenueRequest();
            req.setName("Gachibowli Smash Arena");
            req.setDescription("Premier indoor badminton courts with wooden flooring");
            req.setAddress("Gachibowli Stadium Road");
            req.setCity("Hyderabad");
            req.setState("Telangana");
            req.setPincode("500032");
            req.setLatitude(17.4400);
            req.setLongitude(78.3489);
            req.setPhone("9876543210");
            req.setPricePerHour(BigDecimal.valueOf(800.00));
            req.setSportIds(List.of(cricketSport.getId()));
            req.setAmenityIds(List.of(parkingAmenity.getId()));

            mockMvc.perform(post("/api/venues")
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Venue created successfully"))
                    .andExpect(jsonPath("$.data.name").value("Gachibowli Smash Arena"))
                    .andExpect(jsonPath("$.data.pricePerHour").value(800.00))
                    .andExpect(jsonPath("$.data.sports[0].id").value(cricketSport.getId()))
                    .andExpect(jsonPath("$.data.isActive").value(true));
        }

        @Test
        @DisplayName("POST /api/venues: Player attempting to create venue receives 403 FORBIDDEN")
        void playerCannotCreateVenue() throws Exception {
            CreateVenueRequest req = new CreateVenueRequest();
            req.setName("Unauthorized Venue");
            req.setAddress("Address 123");
            req.setCity("Hyderabad");
            req.setState("Telangana");
            req.setPincode("500032");
            req.setLatitude(17.4400);
            req.setLongitude(78.3489);
            req.setPhone("9876543210");
            req.setPricePerHour(BigDecimal.valueOf(500.00));
            req.setSportIds(List.of(cricketSport.getId()));

            mockMvc.perform(post("/api/venues")
                            .session(createAuthSession(playerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }

        @Test
        @DisplayName("POST /api/venues: Unauthenticated user receives 401 UNAUTHORISED")
        void unauthenticatedCannotCreateVenue() throws Exception {
            CreateVenueRequest req = new CreateVenueRequest();
            req.setName("Unauthenticated Venue");
            req.setAddress("Address 123");
            req.setCity("Hyderabad");
            req.setState("Telangana");
            req.setPincode("500032");
            req.setLatitude(17.4400);
            req.setLongitude(78.3489);
            req.setPhone("9876543210");
            req.setPricePerHour(BigDecimal.valueOf(500.00));
            req.setSportIds(List.of(cricketSport.getId()));

            mockMvc.perform(post("/api/venues")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("UNAUTHORISED"));
        }

        @Test
        @DisplayName("PUT /api/venues/{id}: Owner successfully updates venue")
        void ownerUpdatesVenue() throws Exception {
            UpdateVenueRequest req = new UpdateVenueRequest();
            req.setName("Apex Cricket & Multi-Sport Turf");
            req.setPricePerHour(BigDecimal.valueOf(1500.00));
            req.setIsActive(false);

            mockMvc.perform(put("/api/venues/" + primaryVenue.getId())
                            .session(createAuthSession(ownerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Venue updated successfully"))
                    .andExpect(jsonPath("$.data.name").value("Apex Cricket & Multi-Sport Turf"))
                    .andExpect(jsonPath("$.data.pricePerHour").value(1500.00))
                    .andExpect(jsonPath("$.data.isActive").value(false));
        }

        @Test
        @DisplayName("PUT /api/venues/{id}: Unauthorized edit by non-owner user returns 403 FORBIDDEN")
        void nonOwnerCannotUpdateVenue() throws Exception {
            UpdateVenueRequest req = new UpdateVenueRequest();
            req.setName("Hacked Venue Name");

            mockMvc.perform(put("/api/venues/" + primaryVenue.getId())
                            .session(createAuthSession(otherOwnerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.message").value("You do not own this venue"));
        }

        @Test
        @DisplayName("PUT /api/venues/{id}: Player user attempting to update returns 403 FORBIDDEN")
        void playerCannotUpdateVenue() throws Exception {
            UpdateVenueRequest req = new UpdateVenueRequest();
            req.setName("Player Edited Name");

            mockMvc.perform(put("/api/venues/" + primaryVenue.getId())
                            .session(createAuthSession(playerUser))
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }

        @Test
        @DisplayName("GET /api/owner/venues: Returns owner-specific venues enriched with reviews and ratings")
        void getOwnerVenues() throws Exception {
            mockMvc.perform(get("/api/owner/venues")
                            .session(createAuthSession(ownerUser)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data", hasSize(greaterThanOrEqualTo(1))))
                    .andExpect(jsonPath("$.data[0].id").value(primaryVenue.getId().toString()))
                    .andExpect(jsonPath("$.data[0].averageRating").value("5.0"))
                    .andExpect(jsonPath("$.data[0].reviewCount").value(1));
        }
    }
}
