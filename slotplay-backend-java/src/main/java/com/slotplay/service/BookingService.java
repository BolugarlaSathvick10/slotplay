package com.slotplay.service;

import com.slotplay.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

public interface BookingService {

    BookingDetailResponse createBooking(UUID userId, CreateBookingRequest req);

    PaymentVerificationResponse submitPayment(UUID userId, UUID bookingId, String utrNumber, MultipartFile file, String screenshotUrl);

    void verifyPayment(UUID ownerId, boolean isAdmin, UUID bookingId, VerifyPaymentRequest req);

    PaginatedData<BookingDetailResponse> getUserBookings(UUID userId, int page, int limit, String status);

    BookingDetailResponse getBookingDetail(UUID bookingId, UUID userId, boolean isAdmin);

    void cancelBooking(UUID bookingId, UUID userId);

    PaginatedData<BookingDetailResponse> getPendingVerifications(UUID ownerId, int page, int limit);

    PaginatedData<BookingDetailResponse> getOwnerBookings(UUID ownerId, int page, int limit, String status);

    PaginatedData<BookingDetailResponse> getAllBookings(int page, int limit, String status);

    PaginatedData<BookingDetailResponse> getAdminPendingVerifications(int page, int limit);

    OwnerStatsResponse getOwnerStats(UUID ownerId);

    AdminStatsResponse getAdminStats();

    BookingDetailResponse getTicketByRef(String bookingRef);

    VerifyTicketResponse verifyQrTicket(VerifyTicketRequest req);
}
