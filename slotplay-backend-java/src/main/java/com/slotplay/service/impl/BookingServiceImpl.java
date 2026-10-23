package com.slotplay.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.*;
import com.slotplay.entity.*;
import com.slotplay.exception.AppException;
import com.slotplay.repository.*;
import com.slotplay.service.BookingService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingServiceImpl implements BookingService {

    private static final List<String> ACTIVE_STATUSES = List.of(
            "pending_payment",
            "pending_verification",
            "confirmed"
    );

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final BookingRepository bookingRepository;
    private final SlotRepository slotRepository;
    private final VenueRepository venueRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final PaymentVerificationRepository paymentVerificationRepository;
    private final ObjectMapper objectMapper;
    private final com.slotplay.service.NotificationService notificationService;
    private final com.slotplay.service.EmailService emailService;
    private final com.slotplay.service.StorageService storageService;

    public BookingServiceImpl(
            BookingRepository bookingRepository,
            SlotRepository slotRepository,
            VenueRepository venueRepository,
            UserRepository userRepository,
            PaymentRepository paymentRepository,
            PaymentVerificationRepository paymentVerificationRepository,
            ObjectMapper objectMapper,
            com.slotplay.service.NotificationService notificationService,
            com.slotplay.service.EmailService emailService,
            com.slotplay.service.StorageService storageService
    ) {
        this.bookingRepository = bookingRepository;
        this.slotRepository = slotRepository;
        this.venueRepository = venueRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.paymentVerificationRepository = paymentVerificationRepository;
        this.objectMapper = objectMapper;
        this.notificationService = notificationService;
        this.emailService = emailService;
        this.storageService = storageService;
    }

    public static String generateBookingRef() {
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        byte[] bytes = new byte[2];
        RANDOM.nextBytes(bytes);
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02X", b));
        }
        return "SP-" + dateStr + "-" + sb.toString();
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public BookingDetailResponse createBooking(UUID userId, CreateBookingRequest req) {
        if (req.getSlotId() == null || req.getVenueId() == null) {
            throw new AppException("slotId and venueId are required", HttpStatus.BAD_REQUEST, "MISSING_PARAMS");
        }

        // Concurrency protection: acquire pessimistic write lock on the slot row
        Slot slot = slotRepository.findByIdForUpdate(req.getSlotId())
                .orElseThrow(() -> AppException.notFound("Slot"));

        if (!slot.getVenue().getId().equals(req.getVenueId())) {
            throw new AppException("Slot does not belong to this venue", HttpStatus.BAD_REQUEST, "INVALID_SLOT");
        }

        // Concurrency check: verify no active booking exists while holding slot lock
        Optional<Booking> activeBookingOpt = bookingRepository
                .findTopBySlotIdAndStatusInOrderByCreatedAtDesc(slot.getId(), ACTIVE_STATUSES);

        if (activeBookingOpt.isPresent()) {
            Booking existingBooking = activeBookingOpt.get();
            boolean isPendingExpired = "pending_payment".equalsIgnoreCase(existingBooking.getStatus())
                    && existingBooking.getCreatedAt() != null
                    && Instant.now().isAfter(existingBooking.getCreatedAt().plus(java.time.Duration.ofMinutes(15)));

            if (isPendingExpired) {
                // Expire stale unpaid booking to unblock slot
                existingBooking.setStatus("cancelled");
                existingBooking.setCancelledAt(Instant.now());
                bookingRepository.save(existingBooking);
            } else {
                throw new AppException("This slot is already booked", HttpStatus.CONFLICT, "SLOT_UNAVAILABLE");
            }
        }

        if (!"available".equalsIgnoreCase(slot.getStatus())) {
            throw new AppException("This slot is already booked", HttpStatus.CONFLICT, "SLOT_UNAVAILABLE");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.unauthorized("User not found"));

        String bookingRef = generateBookingRef();
        BigDecimal totalAmount = slot.getPrice();

        Booking booking = new Booking(
                user,
                slot,
                slot.getVenue(),
                bookingRef,
                totalAmount,
                "pending_payment"
        );
        Booking savedBooking;
        try {
            savedBooking = bookingRepository.save(booking);
            bookingRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new AppException("This slot is already booked", HttpStatus.CONFLICT, "SLOT_UNAVAILABLE");
        }

        Payment payment = new Payment(
                savedBooking,
                user,
                totalAmount,
                "INR",
                "upi_manual",
                "pending"
        );
        paymentRepository.save(payment);

        return mapToDetailResponse(savedBooking);
    }

    @Override
    public PaymentVerificationResponse submitPayment(UUID userId, UUID bookingId, String utrNumber, MultipartFile file, String screenshotUrl) {
        if (utrNumber == null || !utrNumber.trim().matches("^\\d{12,16}$")) {
            throw new AppException("UTR must be 12 to 16 digits", HttpStatus.BAD_REQUEST, "INVALID_UTR");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> AppException.notFound("Booking"));

        if (!booking.getUser().getId().equals(userId)) {
            throw AppException.forbidden("This booking does not belong to you");
        }

        if ("confirmed".equalsIgnoreCase(booking.getStatus()) || "cancelled".equalsIgnoreCase(booking.getStatus())) {
            throw new AppException("This booking is not awaiting payment", HttpStatus.BAD_REQUEST, "INVALID_STATE");
        }

        String resolvedUrl = screenshotUrl;
        String resolvedKey = screenshotUrl;

        if (file != null && !file.isEmpty()) {
            com.slotplay.dto.UploadResult uploadResult = storageService.upload(file, "payment-screenshots");
            resolvedUrl = uploadResult.getUrl();
            resolvedKey = uploadResult.getKey();
        }

        if (resolvedUrl == null || resolvedUrl.trim().isEmpty()) {
            throw new AppException("Payment screenshot is required", HttpStatus.BAD_REQUEST, "MISSING_FILE");
        }

        Payment payment = paymentRepository.findByBookingId(bookingId)
                .orElseThrow(() -> AppException.notFound("Payment"));

        PaymentVerification verification = new PaymentVerification(
                payment,
                booking,
                booking.getUser(),
                utrNumber.trim(),
                resolvedKey,
                resolvedUrl,
                "submitted"
        );
        PaymentVerification savedVerification = paymentVerificationRepository.save(verification);

        payment.setStatus("submitted");
        booking.setStatus("pending_verification");
        bookingRepository.save(booking);

        // Notify venue owner via in-app notification & email
        Venue venue = booking.getVenue();
        if (venue != null && venue.getOwner() != null) {
            User owner = venue.getOwner();
            User player = booking.getUser();
            notificationService.createNotification(
                    owner.getId(),
                    "payment_submitted",
                    "Payment Awaiting Verification ⏳",
                    player.getEmail() + " submitted payment for booking " + booking.getBookingRef() + ". Please verify."
            );
            emailService.sendPaymentSubmittedNotificationEmail(
                    owner.getEmail(),
                    owner.getName(),
                    booking.getBookingRef(),
                    player.getName(),
                    player.getEmail(),
                    venue.getName(),
                    booking.getTotalAmount(),
                    utrNumber.trim()
            );
        }

        return mapToVerificationResponse(savedVerification);
    }

    @Override
    public void verifyPayment(UUID ownerId, boolean isAdmin, UUID bookingId, VerifyPaymentRequest req) {
        if (req.getApproved() == null) {
            throw new AppException("approved field is required", HttpStatus.BAD_REQUEST, "MISSING_PARAMS");
        }

        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> AppException.notFound("Booking"));

        Venue venue = booking.getVenue();
        if (!isAdmin && !venue.getOwner().getId().equals(ownerId)) {
            throw AppException.forbidden("You do not own this venue");
        }

        boolean isApproved = Boolean.TRUE.equals(req.getApproved());

        // Safe against duplicate requests & retries
        if ("confirmed".equalsIgnoreCase(booking.getStatus())) {
            if (isApproved) {
                // Idempotent retry: booking is already confirmed, safe return
                return;
            } else {
                throw new AppException("Booking has already been confirmed and cannot be rejected", HttpStatus.BAD_REQUEST, "INVALID_STATE");
            }
        }

        if ("rejected".equalsIgnoreCase(booking.getStatus())) {
            if (!isApproved) {
                // Idempotent retry: booking is already rejected, safe return
                return;
            } else {
                throw new AppException("Booking has already been rejected and cannot be confirmed", HttpStatus.BAD_REQUEST, "INVALID_STATE");
            }
        }

        User reviewer = userRepository.findById(ownerId).orElse(null);
        Payment payment = paymentRepository.findByBookingId(bookingId).orElse(null);
        User player = booking.getUser();

        PaymentVerification verification = paymentVerificationRepository
                .findFirstByBookingIdOrderByCreatedAtDesc(bookingId)
                .orElse(null);

        if (verification == null) {
            verification = new PaymentVerification(
                    payment,
                    booking,
                    player != null ? player : reviewer,
                    "DIRECT_CONFIRMATION",
                    "DIRECT_CONFIRMATION",
                    "DIRECT_CONFIRMATION",
                    isApproved ? "approved" : "rejected"
            );
        }

        if (isApproved) {
            verification.setStatus("approved");
            verification.setReviewedBy(reviewer);
            verification.setReviewedAt(Instant.now());

            if (payment != null) {
                payment.setStatus("verified");
            }

            booking.setStatus("confirmed");
            booking.setConfirmedAt(Instant.now());
            booking.getSlot().setStatus("booked");

            // Attach QR ticket reference URL
            booking.setQrCodeUrl("/api/bookings/ticket/" + booking.getBookingRef());

            if (player != null) {
                notificationService.createNotification(
                        player.getId(),
                        "booking_confirmed",
                        "Booking Confirmed! 🎉",
                        "Your booking at " + venue.getName() + " on " + booking.getSlot().getDate() + " has been confirmed."
                );
                emailService.sendBookingConfirmationEmail(
                        player.getEmail(),
                        player.getName(),
                        booking.getBookingRef(),
                        venue.getName(),
                        venue.getAddress(),
                        booking.getSlot().getDate().toString(),
                        booking.getSlot().getStartTime().format(TIME_FORMATTER),
                        booking.getSlot().getEndTime().format(TIME_FORMATTER),
                        booking.getTotalAmount()
                );
            }
        } else {
            verification.setStatus("rejected");
            verification.setReviewedBy(reviewer);
            verification.setReviewNote(req.getRejectionReason());
            verification.setReviewedAt(Instant.now());

            if (payment != null) {
                payment.setStatus("rejected");
            }

            booking.setStatus("rejected");
            booking.getSlot().setStatus("available");

            if (player != null) {
                notificationService.createNotification(
                        player.getId(),
                        "payment_rejected",
                        "Payment Not Verified ❌",
                        "Your payment for booking " + booking.getBookingRef() + " could not be verified."
                                + (req.getRejectionReason() != null ? " Reason: " + req.getRejectionReason() : "")
                );
                emailService.sendPaymentRejectedEmail(
                        player.getEmail(),
                        player.getName(),
                        booking.getBookingRef(),
                        venue.getName(),
                        req.getRejectionReason()
                );
            }
        }

        paymentVerificationRepository.save(verification);
        if (payment != null) {
            paymentRepository.save(payment);
        }
        bookingRepository.save(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedData<BookingDetailResponse> getUserBookings(UUID userId, int page, int limit, String status) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(50, Math.max(1, limit));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);

        String normalizedStatus = status;
        if ("awaiting_payment".equalsIgnoreCase(status)) {
            normalizedStatus = "pending_payment";
        }

        Page<Booking> bookingPage;
        if (normalizedStatus != null && !normalizedStatus.trim().isEmpty()) {
            bookingPage = bookingRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, normalizedStatus, pageable);
        } else {
            bookingPage = bookingRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<BookingDetailResponse> responses = bookingPage.getContent().stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());

        return new PaginatedData<>(
                responses,
                safePage,
                safeLimit,
                (int) bookingPage.getTotalElements(),
                bookingPage.getTotalPages()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public BookingDetailResponse getBookingDetail(UUID bookingId, UUID userId, boolean isAdmin) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> AppException.notFound("Booking"));

        if (!isAdmin && !booking.getUser().getId().equals(userId) && !booking.getVenue().getOwner().getId().equals(userId)) {
            throw AppException.forbidden("This booking does not belong to you");
        }

        return mapToDetailResponse(booking);
    }

    @Override
    public void cancelBooking(UUID bookingId, UUID userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> AppException.notFound("Booking"));

        if (!booking.getUser().getId().equals(userId)) {
            throw AppException.forbidden("This booking does not belong to you");
        }

        if (!"pending_payment".equalsIgnoreCase(booking.getStatus()) && !"pending_verification".equalsIgnoreCase(booking.getStatus())) {
            throw new AppException("Only pending_payment bookings can be cancelled", HttpStatus.BAD_REQUEST, "CANNOT_CANCEL");
        }

        booking.setStatus("cancelled");
        booking.setCancelledAt(Instant.now());
        booking.getSlot().setStatus("available");

        bookingRepository.save(booking);

        if (booking.getUser() != null) {
            notificationService.createNotification(
                    booking.getUser().getId(),
                    "general",
                    "Booking Cancelled",
                    "Your booking " + booking.getBookingRef() + " at " + booking.getVenue().getName() + " has been cancelled."
            );
            emailService.sendBookingCancelledEmail(
                    booking.getUser().getEmail(),
                    booking.getUser().getName(),
                    booking.getBookingRef(),
                    booking.getVenue().getName(),
                    booking.getSlot().getDate().toString()
            );
        }
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedData<BookingDetailResponse> getPendingVerifications(UUID ownerId, int page, int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(50, Math.max(1, limit));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);

        Page<Booking> pageResult = bookingRepository
                .findByVenueOwnerIdAndStatusInOrderByCreatedAtDesc(
                        ownerId,
                        List.of("pending_verification", "pending_payment"),
                        pageable
                );

        List<BookingDetailResponse> content = pageResult.getContent().stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());

        return new PaginatedData<>(
                content,
                safePage,
                safeLimit,
                (int) pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedData<BookingDetailResponse> getOwnerBookings(UUID ownerId, int page, int limit, String status) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(50, Math.max(1, limit));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);

        Page<Booking> pageResult;
        if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status.trim())) {
            pageResult = bookingRepository.findByVenueOwnerIdAndStatusOrderByCreatedAtDesc(ownerId, status.trim().toLowerCase(), pageable);
        } else {
            pageResult = bookingRepository.findByVenueOwnerIdOrderByCreatedAtDesc(ownerId, pageable);
        }

        List<BookingDetailResponse> content = pageResult.getContent().stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());

        return new PaginatedData<>(
                content,
                safePage,
                safeLimit,
                (int) pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedData<BookingDetailResponse> getAllBookings(int page, int limit, String status) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(50, Math.max(1, limit));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);

        Page<Booking> pageResult;
        if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status.trim())) {
            pageResult = bookingRepository.findByStatusOrderByCreatedAtDesc(status.trim().toLowerCase(), pageable);
        } else {
            pageResult = bookingRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        List<BookingDetailResponse> content = pageResult.getContent().stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());

        return new PaginatedData<>(
                content,
                safePage,
                safeLimit,
                (int) pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedData<BookingDetailResponse> getAdminPendingVerifications(int page, int limit) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(50, Math.max(1, limit));
        Pageable pageable = PageRequest.of(safePage - 1, safeLimit);

        Page<Booking> pageResult = bookingRepository
                .findByStatusInOrderByCreatedAtDesc(
                        List.of("pending_verification", "pending_payment"),
                        pageable
                );

        List<BookingDetailResponse> content = pageResult.getContent().stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());

        return new PaginatedData<>(
                content,
                safePage,
                safeLimit,
                (int) pageResult.getTotalElements(),
                pageResult.getTotalPages()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public OwnerStatsResponse getOwnerStats(UUID ownerId) {
        long total = bookingRepository.countByVenueOwnerId(ownerId);
        long confirmed = bookingRepository.countByVenueOwnerIdAndStatus(ownerId, "confirmed");
        long pending = bookingRepository.countByVenueOwnerIdAndStatusIn(ownerId, List.of("pending_verification", "pending_payment"));
        BigDecimal revenue = paymentRepository.sumVerifiedRevenueByOwnerId(ownerId);
        long venues = venueRepository.countByOwnerId(ownerId);

        return new OwnerStatsResponse(total, confirmed, pending, revenue, venues);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminStatsResponse getAdminStats() {
        long users = userRepository.count();
        long venues = venueRepository.count();
        long bookings = bookingRepository.count();
        long confirmed = bookingRepository.countByStatus("confirmed");
        long pending = bookingRepository.countByStatusIn(List.of("pending_verification", "pending_payment"));
        BigDecimal revenue = paymentRepository.sumVerifiedRevenue();

        return new AdminStatsResponse(users, venues, bookings, confirmed, pending, revenue);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingDetailResponse getTicketByRef(String bookingRef) {
        Booking booking = bookingRepository.findByBookingRef(bookingRef)
                .orElseThrow(() -> AppException.notFound("Booking"));
        return mapToDetailResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public VerifyTicketResponse verifyQrTicket(VerifyTicketRequest req) {
        String ref = null;
        BigDecimal expectedAmount = null;

        if (req.getQrData() != null && !req.getQrData().trim().isEmpty()) {
            String raw = req.getQrData().trim();
            if (raw.startsWith("{")) {
                try {
                    JsonNode node = objectMapper.readTree(raw);
                    if (node.hasNonNull("ref")) {
                        ref = node.get("ref").asText();
                    }
                    if (node.hasNonNull("amount")) {
                        expectedAmount = new BigDecimal(node.get("amount").asText());
                    }
                } catch (Exception e) {
                    throw new AppException("Invalid QR ticket data: malformed payload", HttpStatus.BAD_REQUEST, "INVALID_TICKET");
                }
            } else if (raw.startsWith("SP-")) {
                ref = raw;
            } else {
                throw new AppException("Invalid QR ticket format", HttpStatus.BAD_REQUEST, "INVALID_TICKET");
            }
        }

        if (ref == null && req.getRef() != null && !req.getRef().trim().isEmpty()) {
            ref = req.getRef().trim();
        }

        if (ref == null || ref.isEmpty()) {
            throw new AppException("Ticket reference is required", HttpStatus.BAD_REQUEST, "INVALID_TICKET");
        }

        final String ticketRef = ref;
        Booking booking = bookingRepository.findByBookingRef(ticketRef)
                .orElseThrow(() -> new AppException("Ticket not found: no booking with reference " + ticketRef, HttpStatus.NOT_FOUND, "INVALID_TICKET"));

        if ("cancelled".equalsIgnoreCase(booking.getStatus())) {
            throw new AppException("Ticket is invalid: booking has been cancelled", HttpStatus.BAD_REQUEST, "TICKET_CANCELLED");
        }

        if (!"confirmed".equalsIgnoreCase(booking.getStatus())) {
            throw new AppException("Ticket is not valid: booking status is " + booking.getStatus(), HttpStatus.BAD_REQUEST, "TICKET_NOT_CONFIRMED");
        }

        if (expectedAmount != null && booking.getTotalAmount().compareTo(expectedAmount) != 0) {
            throw new AppException("Ticket amount mismatch", HttpStatus.BAD_REQUEST, "INVALID_TICKET");
        }

        QrTicketPayload ticket = createQrTicket(booking);
        BookingDetailResponse detail = mapToDetailResponse(booking);

        return new VerifyTicketResponse(true, "Ticket verified successfully", ticket, detail);
    }

    private QrTicketPayload createQrTicket(Booking booking) {
        String slotTime = booking.getSlot() != null && booking.getSlot().getStartTime() != null
                ? booking.getSlot().getStartTime().format(TIME_FORMATTER)
                : "";
        return new QrTicketPayload(
                booking.getBookingRef(),
                booking.getVenue() != null ? booking.getVenue().getName() : "",
                slotTime,
                booking.getTotalAmount()
        );
    }

    private BookingDetailResponse mapToDetailResponse(Booking b) {
        BookingDetailResponse resp = new BookingDetailResponse();
        resp.setId(b.getId());
        resp.setBookingRef(b.getBookingRef());
        resp.setUserId(b.getUser().getId());
        resp.setSlotId(b.getSlot().getId());
        resp.setVenueId(b.getVenue().getId());
        resp.setTotalAmount(b.getTotalAmount());
        resp.setStatus(b.getStatus());
        resp.setQrCodeUrl(b.getQrCodeUrl());
        resp.setConfirmedAt(b.getConfirmedAt());
        resp.setCancelledAt(b.getCancelledAt());
        resp.setCreatedAt(b.getCreatedAt());
        resp.setUpdatedAt(b.getUpdatedAt());

        if ("confirmed".equalsIgnoreCase(b.getStatus())) {
            resp.setQrTicket(createQrTicket(b));
        }

        // Venue details
        Venue v = b.getVenue();
        if (v != null) {
            VenueListItemResponse venueItem = new VenueListItemResponse();
            venueItem.setId(v.getId().toString());
            venueItem.setName(v.getName());
            venueItem.setAddress(v.getAddress());
            venueItem.setCity(v.getCity());
            venueItem.setState(v.getState());
            venueItem.setPincode(v.getPincode());
            venueItem.setPhone(v.getPhone());
            venueItem.setPricePerHour(v.getPricePerHour());
            venueItem.setStatus(v.getStatus());
            venueItem.setActive("active".equalsIgnoreCase(v.getStatus()));
            resp.setVenue(venueItem);
        }

        // Slot details
        Slot s = b.getSlot();
        if (s != null) {
            SlotItemResponse slotItem = new SlotItemResponse(
                    s.getId(),
                    s.getVenue().getId(),
                    s.getDate().toString(),
                    s.getStartTime().format(TIME_FORMATTER),
                    s.getEndTime().format(TIME_FORMATTER),
                    s.getPrice(),
                    s.getStatus(),
                    s.getCreatedAt(),
                    s.getUpdatedAt()
            );
            resp.setSlot(slotItem);
        }

        // Payment details
        paymentRepository.findByBookingId(b.getId()).ifPresent(p -> {
            PaymentResponse payResp = new PaymentResponse(
                    p.getId(),
                    p.getBooking().getId(),
                    p.getUser().getId(),
                    p.getAmount(),
                    p.getCurrency(),
                    p.getMethod(),
                    p.getStatus(),
                    p.getCreatedAt()
            );
            resp.setPayment(payResp);
        });

        // Verification details
        paymentVerificationRepository.findFirstByBookingIdOrderByCreatedAtDesc(b.getId()).ifPresent(pv -> {
            PaymentVerificationResponse pvResp = new PaymentVerificationResponse(
                    pv.getId(),
                    pv.getPayment().getId(),
                    pv.getBooking().getId(),
                    pv.getSubmittedBy().getId(),
                    pv.getUtrNumber(),
                    pv.getScreenshotUrl(),
                    pv.getScreenshotKey(),
                    pv.getStatus(),
                    pv.getReviewNote(),
                    pv.getSubmittedAt(),
                    pv.getReviewedAt()
            );
            resp.setVerification(pvResp);
        });

        // User summary
        User u = b.getUser();
        if (u != null) {
            resp.setUser(new BookingDetailResponse.BookingUserSummary(
                    u.getId(),
                    u.getName(),
                    u.getEmail(),
                    u.getPhone()
            ));
        }

        return resp;
    }

    private PaymentVerificationResponse mapToVerificationResponse(PaymentVerification pv) {
        return new PaymentVerificationResponse(
                pv.getId(),
                pv.getPayment().getId(),
                pv.getBooking().getId(),
                pv.getSubmittedBy().getId(),
                pv.getUtrNumber(),
                pv.getScreenshotUrl(),
                pv.getScreenshotKey(),
                pv.getStatus(),
                pv.getReviewNote(),
                pv.getSubmittedAt(),
                pv.getReviewedAt()
        );
    }
}
