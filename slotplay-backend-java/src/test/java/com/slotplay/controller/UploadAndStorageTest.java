package com.slotplay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.ReorderImagesRequest;
import com.slotplay.dto.UploadResult;
import com.slotplay.entity.*;
import com.slotplay.repository.*;
import com.slotplay.security.UserPrincipal;
import com.slotplay.service.StorageService;
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
class UploadAndStorageTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private StorageService storageService;

    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private VenueImageRepository venueImageRepository;

    @Autowired
    private SportRepository sportRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private User ownerUser;
    private User otherOwnerUser;
    private Venue venue;

    private static final byte[] VALID_PNG = new byte[] {
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

    @BeforeEach
    void setUp() {
        Role ownerRole = roleRepository.findByName("owner")
                .orElseGet(() -> roleRepository.save(new Role("owner")));

        ownerUser = new User();
        ownerUser.setName("Venue Owner");
        ownerUser.setEmail("owner." + UUID.randomUUID() + "@slotplay.in");
        ownerUser.setPasswordHash("hashed_pass");
        ownerUser.setRole(ownerRole);
        ownerUser.setVerified(true);
        ownerUser = userRepository.save(ownerUser);

        otherOwnerUser = new User();
        otherOwnerUser.setName("Other Venue Owner");
        otherOwnerUser.setEmail("other." + UUID.randomUUID() + "@slotplay.in");
        otherOwnerUser.setPasswordHash("hashed_pass");
        otherOwnerUser.setRole(ownerRole);
        otherOwnerUser.setVerified(true);
        otherOwnerUser = userRepository.save(otherOwnerUser);

        Sport sport = sportRepository.findByName("Cricket")
                .orElseGet(() -> sportRepository.save(new Sport("Cricket", "https://slotplay.in/cricket.svg")));

        venue = new Venue();
        venue.setOwner(ownerUser);
        venue.setSport(sport);
        venue.setName("Strikers Turf");
        venue.setAddress("Kondapur");
        venue.setCity("Hyderabad");
        venue.setState("Telangana");
        venue.setPincode("500084");
        venue.setPricePerHour(BigDecimal.valueOf(1100.00));
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
    @DisplayName("Storage: Successfully saves valid image to disk and provides valid URL")
    void testStorageSaveAndUrlResolution() {
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "test.png",
                "image/png",
                VALID_PNG
        );

        UploadResult result = storageService.upload(file, "venue-images");
        assertNotNull(result);
        assertNotNull(result.getUrl());
        assertTrue(result.getUrl().startsWith("/uploads/venue-images/"));
        assertTrue(result.getKey().startsWith("venue-images/"));
        assertEquals("image/png", result.getMimeType());
        assertTrue(result.getSizeBytes() > 0);

        // Delete test
        storageService.delete(result.getKey());
    }

    @Test
    @DisplayName("Validation: Non-image file with disguised extension is rejected with 400 INVALID_IMAGE")
    void testDisguisedNonImageFileRejected() {
        byte[] fakeImageBytes = "This is plain text pretending to be a JPG".getBytes();
        MockMultipartFile file = new MockMultipartFile(
                "image",
                "malicious.jpg",
                "image/jpeg",
                fakeImageBytes
        );

        var ex = assertThrows(Exception.class, () -> storageService.upload(file, "venue-images"));
        assertTrue(ex.getMessage().contains("Uploaded file is not a valid image"));
    }

    @Test
    @DisplayName("Validation: Disallowed MIME type (PDF) is rejected with 400 INVALID_FILE_TYPE")
    void testDisallowedMimeTypeRejected() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "doc.pdf",
                "application/pdf",
                new byte[] { 0x25, 0x50, 0x44, 0x46 } // %PDF
        );

        var ex = assertThrows(Exception.class, () -> storageService.upload(file, "venue-images"));
        assertTrue(ex.getMessage().contains("File type not allowed"));
    }

    @Test
    @DisplayName("Venue Images: Owner uploads multiple images, first is primary, sort orders assigned")
    void testOwnerUploadsVenueImages() throws Exception {
        MockMultipartFile img1 = new MockMultipartFile("images", "turf1.png", "image/png", VALID_PNG);
        MockMultipartFile img2 = new MockMultipartFile("images", "turf2.png", "image/png", VALID_PNG);

        mockMvc.perform(multipart("/api/venues/" + venue.getId() + "/images")
                        .file(img1)
                        .file(img2)
                        .session(createAuthSession(ownerUser)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data", hasSize(2)))
                .andExpect(jsonPath("$.data[0].isPrimary").value(true))
                .andExpect(jsonPath("$.data[1].isPrimary").value(false));

        List<VenueImage> images = venueImageRepository.findByVenueIdOrderByIsPrimaryDescSortOrderAsc(venue.getId());
        assertEquals(2, images.size());
    }

    @Test
    @DisplayName("Venue Images: Exceeding 8 image limit returns 400 IMAGE_LIMIT_EXCEEDED")
    void testExceedingImageLimitRejected() throws Exception {
        // First pre-populate 7 images
        for (int i = 0; i < 7; i++) {
            venueImageRepository.save(new VenueImage(venue, "/uploads/venue-images/" + i + ".png", "key" + i, i == 0, i));
        }

        // Attempting to upload 2 more images (7 + 2 = 9 > 8)
        MockMultipartFile img1 = new MockMultipartFile("images", "turfA.png", "image/png", VALID_PNG);
        MockMultipartFile img2 = new MockMultipartFile("images", "turfB.png", "image/png", VALID_PNG);

        mockMvc.perform(multipart("/api/venues/" + venue.getId() + "/images")
                        .file(img1)
                        .file(img2)
                        .session(createAuthSession(ownerUser)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("IMAGE_LIMIT_EXCEEDED"));
    }

    @Test
    @DisplayName("Venue Images: Setting primary image updates primary flag and unsets old primary")
    void testSetPrimaryVenueImage() throws Exception {
        VenueImage img1 = venueImageRepository.save(new VenueImage(venue, "/url1", "key1", true, 0));
        VenueImage img2 = venueImageRepository.save(new VenueImage(venue, "/url2", "key2", false, 1));

        mockMvc.perform(patch("/api/venues/" + venue.getId() + "/images/" + img2.getId() + "/primary")
                        .session(createAuthSession(ownerUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Primary image updated"));

        VenueImage updated1 = venueImageRepository.findById(img1.getId()).orElseThrow();
        VenueImage updated2 = venueImageRepository.findById(img2.getId()).orElseThrow();
        assertFalse(updated1.isPrimary());
        assertTrue(updated2.isPrimary());
    }

    @Test
    @DisplayName("Venue Images: Reordering images updates sort_order sequentially")
    void testReorderVenueImages() throws Exception {
        VenueImage img1 = venueImageRepository.save(new VenueImage(venue, "/url1", "key1", true, 0));
        VenueImage img2 = venueImageRepository.save(new VenueImage(venue, "/url2", "key2", false, 1));

        // Invert order
        ReorderImagesRequest reorderReq = new ReorderImagesRequest(List.of(img2.getId(), img1.getId()));

        mockMvc.perform(patch("/api/venues/" + venue.getId() + "/images/reorder")
                        .session(createAuthSession(ownerUser))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(reorderReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Images reordered"));

        VenueImage updated1 = venueImageRepository.findById(img1.getId()).orElseThrow();
        VenueImage updated2 = venueImageRepository.findById(img2.getId()).orElseThrow();
        assertEquals(1, updated1.getSortOrder());
        assertEquals(0, updated2.getSortOrder());
    }

    @Test
    @DisplayName("Venue Images: Deleting primary image promotes the next image to primary")
    void testDeletePrimaryImagePromotesNext() throws Exception {
        VenueImage img1 = venueImageRepository.save(new VenueImage(venue, "/url1", "key1", true, 0));
        VenueImage img2 = venueImageRepository.save(new VenueImage(venue, "/url2", "key2", false, 1));

        mockMvc.perform(delete("/api/venues/" + venue.getId() + "/images/" + img1.getId())
                        .session(createAuthSession(ownerUser)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Image deleted"));

        assertFalse(venueImageRepository.existsById(img1.getId()));
        VenueImage promoted = venueImageRepository.findById(img2.getId()).orElseThrow();
        assertTrue(promoted.isPrimary(), "Next image must be promoted to primary upon deleting primary image");
    }

    @Test
    @DisplayName("Unauthorized: Non-owner attempting to upload venue images returns 403 FORBIDDEN")
    void testNonOwnerCannotUploadVenueImages() throws Exception {
        MockMultipartFile img = new MockMultipartFile("images", "turf.png", "image/png", VALID_PNG);

        mockMvc.perform(multipart("/api/venues/" + venue.getId() + "/images")
                        .file(img)
                        .session(createAuthSession(otherOwnerUser)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }
}
