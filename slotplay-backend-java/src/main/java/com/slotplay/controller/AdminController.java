package com.slotplay.controller;

import com.slotplay.dto.AdminReportsResponse;
import com.slotplay.dto.AdminStatsResponse;
import com.slotplay.dto.ApiResponse;
import com.slotplay.dto.BookingDetailResponse;
import com.slotplay.dto.PaginatedData;
import com.slotplay.dto.UpdateVenueStatusRequest;
import com.slotplay.entity.Venue;
import com.slotplay.exception.AppException;
import com.slotplay.repository.BookingRepository;
import com.slotplay.repository.PaymentRepository;
import com.slotplay.repository.UserRepository;
import com.slotplay.repository.VenueRepository;
import com.slotplay.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final VenueRepository venueRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final BookingService bookingService;

    public AdminController(
            VenueRepository venueRepository,
            UserRepository userRepository,
            BookingRepository bookingRepository,
            PaymentRepository paymentRepository,
            BookingService bookingService
    ) {
        this.venueRepository = venueRepository;
        this.userRepository = userRepository;
        this.bookingRepository = bookingRepository;
        this.paymentRepository = paymentRepository;
        this.bookingService = bookingService;
    }

    @PatchMapping("/venues/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateVenueStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateVenueStatusRequest req
    ) {
        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Venue"));

        String status = Boolean.TRUE.equals(req.getIsActive()) ? "active" : "suspended";
        venue.setStatus(status);
        venueRepository.save(venue);

        Map<String, Object> payload = Map.of(
                "id", venue.getId(),
                "status", venue.getStatus()
        );
        return ResponseEntity.ok(ApiResponse.success(payload, "Venue updated"));
    }

    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<AdminReportsResponse>> getReports() {
        long users = userRepository.count();
        long venues = venueRepository.count();
        long bookings = bookingRepository.count();
        BigDecimal revenue = paymentRepository.sumVerifiedRevenue();

        long confirmed = bookingRepository.countByStatus("confirmed");
        long pendingVerifications = bookingRepository.countByStatus("pending_verification");
        long pendingPayments = bookingRepository.countByStatus("pending_payment");
        long cancelled = bookingRepository.countByStatus("cancelled");
        long rejected = bookingRepository.countByStatus("rejected");
        long activeVenues = venueRepository.countByStatus("active");
        long suspendedVenues = venueRepository.countByStatus("suspended");

        AdminReportsResponse response = new AdminReportsResponse(
                users,
                venues,
                bookings,
                revenue != null ? revenue : BigDecimal.ZERO,
                confirmed,
                pendingVerifications,
                pendingPayments,
                cancelled,
                rejected,
                activeVenues,
                suspendedVenues
        );

        return ResponseEntity.ok(ApiResponse.success(response, "Reports"));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<PaginatedData<BookingDetailResponse>>> getAllBookings(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "status", required = false) String status
    ) {
        PaginatedData<BookingDetailResponse> result = bookingService.getAllBookings(page, limit, status);
        return ResponseEntity.ok(ApiResponse.success(result, "All bookings retrieved"));
    }

    @GetMapping("/verifications")
    public ResponseEntity<ApiResponse<PaginatedData<BookingDetailResponse>>> getPendingVerifications(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "20") int limit
    ) {
        PaginatedData<BookingDetailResponse> result = bookingService.getAdminPendingVerifications(page, limit);
        return ResponseEntity.ok(ApiResponse.success(result, "Pending verifications retrieved"));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<AdminStatsResponse>> getAdminStats() {
        AdminStatsResponse stats = bookingService.getAdminStats();
        return ResponseEntity.ok(ApiResponse.success(stats, "Admin stats retrieved"));
    }
}
