package com.slotplay.controller;

import com.slotplay.dto.*;
import com.slotplay.security.UserPrincipal;
import com.slotplay.service.BookingService;
import com.slotplay.service.SlotService;
import com.slotplay.service.VenueService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/owner")
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
public class OwnerController {

    private final VenueService venueService;
    private final SlotService slotService;
    private final BookingService bookingService;

    public OwnerController(VenueService venueService, SlotService slotService, BookingService bookingService) {
        this.venueService = venueService;
        this.slotService = slotService;
        this.bookingService = bookingService;
    }

    @GetMapping("/venues")
    public ResponseEntity<ApiResponse<List<VenueListItemResponse>>> getOwnerVenues(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        List<VenueListItemResponse> venues = venueService.getOwnerVenues(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(venues));
    }

    @PostMapping("/slots/generate")
    public ResponseEntity<ApiResponse<List<SlotItemResponse>>> generateSlots(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody GenerateSlotsRequest req
    ) {
        boolean isAdmin = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        List<SlotItemResponse> created = slotService.generateSlots(req.getVenueId(), principal.getId(), isAdmin, req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(created, "Generated " + created.size() + " slots"));
    }

    @GetMapping("/verifications")
    public ResponseEntity<ApiResponse<PaginatedData<BookingDetailResponse>>> getPendingVerifications(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit
    ) {
        PaginatedData<BookingDetailResponse> result = bookingService.getPendingVerifications(
                principal.getId(), page, limit
        );
        return ResponseEntity.ok(ApiResponse.success(result, "Pending verifications retrieved"));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<PaginatedData<BookingDetailResponse>>> getOwnerBookings(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "status", required = false) String status
    ) {
        PaginatedData<BookingDetailResponse> result = bookingService.getOwnerBookings(
                principal.getId(), page, limit, status
        );
        return ResponseEntity.ok(ApiResponse.success(result, "Owner bookings retrieved"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<OwnerStatsResponse>> getOwnerStats(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        OwnerStatsResponse stats = bookingService.getOwnerStats(principal.getId());
        return ResponseEntity.ok(ApiResponse.success(stats, "Owner stats retrieved"));
    }
}
