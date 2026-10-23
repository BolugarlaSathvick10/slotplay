package com.slotplay.controller;

import com.slotplay.dto.*;
import com.slotplay.security.UserPrincipal;
import com.slotplay.service.SlotService;
import com.slotplay.service.VenueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/venues")
public class VenueController {

    private final VenueService venueService;
    private final SlotService slotService;

    public VenueController(VenueService venueService, SlotService slotService) {
        this.venueService = venueService;
        this.slotService = slotService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedData<VenueListItemResponse>>> listVenues(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "12") int limit,
            @RequestParam(value = "sportId", required = false) Integer sportId,
            @RequestParam(value = "city", required = false) String city,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "latitude", required = false) Double latitude,
            @RequestParam(value = "longitude", required = false) Double longitude,
            @RequestParam(value = "radiusKm", defaultValue = "10.0") Double radiusKm,
            @RequestParam(value = "sortBy", defaultValue = "rating") String sortBy
    ) {
        PaginatedData<VenueListItemResponse> result = venueService.listVenues(
                page, limit, sportId, city, search, latitude, longitude, radiusKm, sortBy
        );
        return ResponseEntity.ok(ApiResponse.success(result, "Venues retrieved successfully"));
    }

    @GetMapping("/lists/sports")
    public ResponseEntity<ApiResponse<List<SportResponse>>> getSports() {
        List<SportResponse> sports = venueService.getSports();
        return ResponseEntity.ok(ApiResponse.success(sports));
    }

    @GetMapping("/lists/amenities")
    public ResponseEntity<ApiResponse<List<AmenityResponse>>> getAmenities() {
        List<AmenityResponse> amenities = venueService.getAmenities();
        return ResponseEntity.ok(ApiResponse.success(amenities));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VenueDetailResponse>> getVenue(@PathVariable("id") UUID id) {
        VenueDetailResponse venue = venueService.getVenueDetail(id);
        return ResponseEntity.ok(ApiResponse.success(venue));
    }

    @GetMapping("/{id}/slots")
    public ResponseEntity<ApiResponse<List<SlotWithAvailabilityResponse>>> getSlots(
            @PathVariable("id") UUID id,
            @RequestParam(value = "date", required = false) String date
    ) {
        List<SlotWithAvailabilityResponse> slots = slotService.getSlotsByDate(id, date);
        return ResponseEntity.ok(ApiResponse.success(slots, "Slots retrieved successfully"));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<VenueDetailResponse>> createVenue(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateVenueRequest req
    ) {
        VenueDetailResponse venue = venueService.createVenue(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(venue, "Venue created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<VenueDetailResponse>> updateVenue(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateVenueRequest req
    ) {
        boolean isAdmin = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        VenueDetailResponse venue = venueService.updateVenue(id, principal.getId(), isAdmin, req);
        return ResponseEntity.ok(ApiResponse.success(venue, "Venue updated successfully"));
    }

    @PostMapping(value = "/{venueId}/images", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<VenueImageResponse>>> uploadVenueImages(
            @PathVariable("venueId") UUID venueId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam("images") org.springframework.web.multipart.MultipartFile[] images
    ) {
        boolean isAdmin = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        List<VenueImageResponse> result = venueService.uploadVenueImages(venueId, principal.getId(), isAdmin, images);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(result, "Images uploaded successfully"));
    }

    @DeleteMapping("/{venueId}/images/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> deleteVenueImage(
            @PathVariable("venueId") UUID venueId,
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean isAdmin = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        venueService.deleteVenueImage(venueId, id, principal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(null, "Image deleted"));
    }

    @PatchMapping("/{venueId}/images/reorder")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> reorderVenueImages(
            @PathVariable("venueId") UUID venueId,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody com.slotplay.dto.ReorderImagesRequest req
    ) {
        boolean isAdmin = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        venueService.reorderVenueImages(venueId, principal.getId(), isAdmin, req != null ? req.getOrder() : null);
        return ResponseEntity.ok(ApiResponse.success(null, "Images reordered"));
    }

    @PatchMapping("/{venueId}/images/{id}/primary")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> setPrimaryVenueImage(
            @PathVariable("venueId") UUID venueId,
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean isAdmin = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        venueService.setPrimaryVenueImage(venueId, id, principal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(null, "Primary image updated"));
    }
}
