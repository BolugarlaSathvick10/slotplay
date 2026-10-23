package com.slotplay.controller;

import com.slotplay.dto.*;
import com.slotplay.security.UserPrincipal;
import com.slotplay.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/bookings")
@PreAuthorize("isAuthenticated()")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BookingDetailResponse>> createBooking(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateBookingRequest req
    ) {
        BookingDetailResponse booking = bookingService.createBooking(principal.getId(), req);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(booking, "Booking created. You have 30 minutes to submit payment."));
    }

    @PostMapping(value = "/{id}/payment", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<PaymentVerificationResponse>> submitPaymentJson(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) Map<String, Object> body
    ) {
        String utrNumber = body != null && body.get("utrNumber") != null ? body.get("utrNumber").toString() : null;
        String screenshotUrl = body != null && body.get("screenshotUrl") != null ? body.get("screenshotUrl").toString() : null;

        PaymentVerificationResponse verification = bookingService.submitPayment(
                principal.getId(), id, utrNumber, null, screenshotUrl
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(verification, "Payment submitted. The venue owner will verify within 24 hours."));
    }

    @PostMapping(value = "/{id}/payment", consumes = {
            MediaType.MULTIPART_FORM_DATA_VALUE,
            MediaType.APPLICATION_FORM_URLENCODED_VALUE,
            "*/*"
    })
    public ResponseEntity<ApiResponse<PaymentVerificationResponse>> submitPaymentMultipart(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "utrNumber", required = false) String utrNumber,
            @RequestParam(value = "screenshot", required = false) MultipartFile screenshot,
            @RequestParam(value = "screenshotUrl", required = false) String screenshotUrl
    ) {
        PaymentVerificationResponse verification = bookingService.submitPayment(
                principal.getId(), id, utrNumber, screenshot, screenshotUrl
        );

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(verification, "Payment submitted. The venue owner will verify within 24 hours."));
    }

    @PostMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<Void>> verifyPayment(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody VerifyPaymentRequest req
    ) {
        boolean isAdmin = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        bookingService.verifyPayment(principal.getId(), isAdmin, id, req);

        String msg = Boolean.TRUE.equals(req.getApproved())
                ? "Payment verified. User has been notified."
                : "Payment rejected. User has been notified.";

        return ResponseEntity.ok(ApiResponse.success(null, msg));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedData<BookingDetailResponse>>> listBookings(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "status", required = false) String status
    ) {
        PaginatedData<BookingDetailResponse> result = bookingService.getUserBookings(
                principal.getId(), page, limit, status
        );
        return ResponseEntity.ok(ApiResponse.success(result, "Bookings retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BookingDetailResponse>> getBooking(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        boolean isAdmin = principal != null && principal.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        BookingDetailResponse booking = bookingService.getBookingDetail(id, principal.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(booking));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelBooking(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        bookingService.cancelBooking(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.success(null, "Booking cancelled successfully"));
    }

    @GetMapping("/ticket/{bookingRef}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<BookingDetailResponse>> getTicketByRef(
            @PathVariable("bookingRef") String bookingRef
    ) {
        BookingDetailResponse resp = bookingService.getTicketByRef(bookingRef);
        return ResponseEntity.ok(ApiResponse.success(resp, "Ticket details retrieved"));
    }

    @PostMapping({"/ticket/verify", "/verify-ticket"})
    @PreAuthorize("permitAll()")
    public ResponseEntity<ApiResponse<VerifyTicketResponse>> verifyQrTicket(
            @RequestBody VerifyTicketRequest req
    ) {
        VerifyTicketResponse resp = bookingService.verifyQrTicket(req);
        return ResponseEntity.ok(ApiResponse.success(resp, resp.getMessage()));
    }
}
