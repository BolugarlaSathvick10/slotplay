package com.slotplay.service.impl;

import com.slotplay.dto.CreateSlotRequest;
import com.slotplay.dto.GenerateSlotsRequest;
import com.slotplay.dto.SlotItemResponse;
import com.slotplay.dto.SlotWithAvailabilityResponse;
import com.slotplay.entity.Booking;
import com.slotplay.entity.Slot;
import com.slotplay.entity.Venue;
import com.slotplay.exception.AppException;
import com.slotplay.repository.BookingRepository;
import com.slotplay.repository.SlotRepository;
import com.slotplay.repository.VenueRepository;
import com.slotplay.service.SlotService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class SlotServiceImpl implements SlotService {

    private static final List<String> ACTIVE_BOOKING_STATUSES = List.of(
            "pending_payment",
            "pending_verification",
            "confirmed"
    );

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm");

    private final SlotRepository slotRepository;
    private final VenueRepository venueRepository;
    private final BookingRepository bookingRepository;

    public SlotServiceImpl(SlotRepository slotRepository,
                           VenueRepository venueRepository,
                           BookingRepository bookingRepository) {
        this.slotRepository = slotRepository;
        this.venueRepository = venueRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public List<SlotWithAvailabilityResponse> getSlotsByDate(UUID venueId, String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) {
            throw new AppException("date query parameter is required (YYYY-MM-DD)", HttpStatus.BAD_REQUEST, "MISSING_PARAM");
        }
        if (!dateStr.matches("^\\d{4}-\\d{2}-\\d{2}$")) {
            throw new AppException("date must be in YYYY-MM-DD format", HttpStatus.BAD_REQUEST, "INVALID_DATE");
        }

        LocalDate date;
        try {
            date = LocalDate.parse(dateStr);
        } catch (Exception e) {
            throw new AppException("date must be in YYYY-MM-DD format", HttpStatus.BAD_REQUEST, "INVALID_DATE");
        }

        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> AppException.notFound("Venue"));

        ensureDefaultSlotsForDate(venue, date);

        List<Slot> slots = slotRepository.findByVenueIdAndDateOrderByStartTimeAsc(venueId, date);

        List<UUID> slotIds = slots.stream().map(Slot::getId).collect(Collectors.toList());
        List<Booking> activeBookings = slotIds.isEmpty() ? Collections.emptyList() :
                bookingRepository.findBySlotIdInAndStatusIn(slotIds, ACTIVE_BOOKING_STATUSES);

        // Map active bookings by slot ID, ignoring expired pending_payment bookings (> 15 minutes)
        Instant now = Instant.now();
        Map<UUID, Booking> bookingBySlotId = new HashMap<>();
        for (Booking b : activeBookings) {
            boolean isPendingExpired = "pending_payment".equalsIgnoreCase(b.getStatus())
                    && b.getCreatedAt() != null
                    && now.isAfter(b.getCreatedAt().plus(java.time.Duration.ofMinutes(15)));
            if (!isPendingExpired) {
                bookingBySlotId.putIfAbsent(b.getSlot().getId(), b);
            }
        }

        List<SlotWithAvailabilityResponse> result = new ArrayList<>();
        for (Slot slot : slots) {
            Booking activeBooking = bookingBySlotId.get(slot.getId());
            boolean isAvailable = "available".equalsIgnoreCase(slot.getStatus()) && activeBooking == null;
            String bookingStatus = activeBooking != null ? activeBooking.getStatus() : null;

            Instant startDateTime = date.atTime(slot.getStartTime())
                    .atZone(ZoneId.systemDefault())
                    .toInstant();
            Instant endDateTime = date.atTime(slot.getEndTime())
                    .atZone(ZoneId.systemDefault())
                    .toInstant();

            result.add(new SlotWithAvailabilityResponse(
                    slot.getId().toString(),
                    slot.getDate().toString(),
                    slot.getStartTime().format(TIME_FORMATTER),
                    slot.getEndTime().format(TIME_FORMATTER),
                    startDateTime,
                    endDateTime,
                    slot.getPrice(),
                    isAvailable,
                    bookingStatus
            ));
        }

        return result;
    }

    private void ensureDefaultSlotsForDate(Venue venue, LocalDate date) {
        long existingCount = slotRepository.countByVenueIdAndDate(venue.getId(), date);
        if (existingCount > 0) {
            return;
        }

        BigDecimal price = venue.getPricePerHour();
        int openHour = 6;
        int closeHour = 22;

        List<Slot> defaultSlots = new ArrayList<>();
        for (int hour = openHour; hour < closeHour; hour++) {
            LocalTime startTime = LocalTime.of(hour, 0);
            LocalTime endTime = LocalTime.of(hour + 1, 0);
            defaultSlots.add(new Slot(venue, date, startTime, endTime, price, "available"));
        }

        try {
            slotRepository.saveAll(defaultSlots);
        } catch (DataIntegrityViolationException ignored) {
            // Handled gracefully if created concurrently
        }
    }

    @Override
    public List<SlotItemResponse> generateSlots(UUID venueId, UUID ownerId, boolean isAdmin, GenerateSlotsRequest req) {
        if (req.getFromDate() == null || req.getToDate() == null) {
            throw new AppException("venueId, fromDate, toDate required", HttpStatus.BAD_REQUEST, "MISSING_PARAMS");
        }

        if (!req.getFromDate().matches("^\\d{4}-\\d{2}-\\d{2}$") || !req.getToDate().matches("^\\d{4}-\\d{2}-\\d{2}$")) {
            throw new AppException("date must be in YYYY-MM-DD format", HttpStatus.BAD_REQUEST, "INVALID_DATE");
        }

        LocalDate start;
        LocalDate end;
        try {
            start = LocalDate.parse(req.getFromDate());
            end = LocalDate.parse(req.getToDate());
        } catch (Exception e) {
            throw new AppException("date must be in YYYY-MM-DD format", HttpStatus.BAD_REQUEST, "INVALID_DATE");
        }

        if (start.isAfter(end)) {
            throw new AppException("fromDate must be before or equal to toDate", HttpStatus.BAD_REQUEST, "INVALID_DATE_RANGE");
        }

        int openHour = req.getOpenHour();
        int closeHour = req.getCloseHour();
        if (openHour < 0 || openHour > 23 || closeHour < 1 || closeHour > 24 || openHour >= closeHour) {
            throw new AppException("Invalid open or close hour", HttpStatus.BAD_REQUEST, "INVALID_TIME_RANGE");
        }

        int durationMinutes = req.getSlotDurationMinutes();
        if (durationMinutes <= 0 || durationMinutes > 1440) {
            throw new AppException("slotDurationMinutes must be positive and not exceed 1440", HttpStatus.BAD_REQUEST, "INVALID_DURATION");
        }

        // Lock venue pessimistically to protect against concurrent conflicting slot creation
        Venue venue = venueRepository.findByIdForUpdate(venueId)
                .orElseThrow(() -> AppException.notFound("Venue"));

        if (!isAdmin && !venue.getOwner().getId().equals(ownerId)) {
            throw AppException.forbidden("You do not own this venue");
        }

        BigDecimal price = req.getPricePerHour() != null ? req.getPricePerHour() : venue.getPricePerHour();
        List<Slot> createdSlots = new ArrayList<>();

        for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
            for (int startMinutes = openHour * 60; startMinutes + durationMinutes <= closeHour * 60; startMinutes += durationMinutes) {
                LocalTime slotStart = LocalTime.of(startMinutes / 60, startMinutes % 60);
                int endMinutes = startMinutes + durationMinutes;
                LocalTime slotEnd = (endMinutes == 1440) ? LocalTime.MAX : LocalTime.of(endMinutes / 60, endMinutes % 60);

                // Check for overlapping slots
                List<Slot> overlapping = slotRepository.findOverlappingSlots(venueId, day, slotStart, slotEnd);
                if (!overlapping.isEmpty()) {
                    continue; // Skip overlapping slot
                }

                try {
                    Slot slot = new Slot(venue, day, slotStart, slotEnd, price, "available");
                    Slot saved = slotRepository.save(slot);
                    createdSlots.add(saved);
                } catch (DataIntegrityViolationException ignored) {
                    // Skip if duplicate exists
                }
            }
        }

        return createdSlots.stream()
                .map(this::mapToItemResponse)
                .collect(Collectors.toList());
    }

    @Override
    public SlotItemResponse createSlot(UUID venueId, UUID ownerId, boolean isAdmin, CreateSlotRequest req) {
        if (req.getDate() == null || req.getStartTime() == null || req.getEndTime() == null) {
            throw new AppException("date, startTime, and endTime are required", HttpStatus.BAD_REQUEST, "MISSING_PARAMS");
        }

        if (!req.getStartTime().isBefore(req.getEndTime())) {
            throw new AppException("Start time must be before end time", HttpStatus.BAD_REQUEST, "INVALID_TIME");
        }

        Venue venue = venueRepository.findByIdForUpdate(venueId)
                .orElseThrow(() -> AppException.notFound("Venue"));

        if (!isAdmin && !venue.getOwner().getId().equals(ownerId)) {
            throw AppException.forbidden("You do not own this venue");
        }

        List<Slot> overlapping = slotRepository.findOverlappingSlots(venueId, req.getDate(), req.getStartTime(), req.getEndTime());
        if (!overlapping.isEmpty()) {
            throw new AppException("Slot overlaps with an existing slot", HttpStatus.CONFLICT, "SLOT_OVERLAP");
        }

        BigDecimal price = req.getPrice() != null ? req.getPrice() : venue.getPricePerHour();
        String status = req.getStatus() != null ? req.getStatus() : "available";

        Slot slot = new Slot(venue, req.getDate(), req.getStartTime(), req.getEndTime(), price, status);
        Slot saved = slotRepository.save(slot);
        return mapToItemResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isSlotAvailable(UUID slotId) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> AppException.notFound("Slot"));

        if (!"available".equalsIgnoreCase(slot.getStatus())) {
            return false;
        }

        return !bookingRepository.existsBySlotIdAndStatusIn(slotId, ACTIVE_BOOKING_STATUSES);
    }

    private SlotItemResponse mapToItemResponse(Slot slot) {
        return new SlotItemResponse(
                slot.getId(),
                slot.getVenue().getId(),
                slot.getDate().toString(),
                slot.getStartTime().format(TIME_FORMATTER),
                slot.getEndTime().format(TIME_FORMATTER),
                slot.getPrice(),
                slot.getStatus(),
                slot.getCreatedAt(),
                slot.getUpdatedAt()
        );
    }
}
