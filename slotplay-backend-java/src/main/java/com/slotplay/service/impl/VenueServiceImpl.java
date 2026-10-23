package com.slotplay.service.impl;

import com.slotplay.dto.*;
import com.slotplay.entity.*;
import com.slotplay.exception.AppException;
import com.slotplay.repository.*;
import com.slotplay.service.VenueService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;
    private final SportRepository sportRepository;
    private final AmenityRepository amenityRepository;
    private final UserRepository userRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final VenueImageRepository venueImageRepository;
    private final ReviewRepository reviewRepository;
    private final OwnerUpiQrRepository ownerUpiQrRepository;
    private final com.slotplay.service.StorageService storageService;

    public VenueServiceImpl(
            VenueRepository venueRepository,
            SportRepository sportRepository,
            AmenityRepository amenityRepository,
            UserRepository userRepository,
            OwnerProfileRepository ownerProfileRepository,
            VenueImageRepository venueImageRepository,
            ReviewRepository reviewRepository,
            OwnerUpiQrRepository ownerUpiQrRepository,
            com.slotplay.service.StorageService storageService
    ) {
        this.venueRepository = venueRepository;
        this.sportRepository = sportRepository;
        this.amenityRepository = amenityRepository;
        this.userRepository = userRepository;
        this.ownerProfileRepository = ownerProfileRepository;
        this.venueImageRepository = venueImageRepository;
        this.reviewRepository = reviewRepository;
        this.ownerUpiQrRepository = ownerUpiQrRepository;
        this.storageService = storageService;
    }

    private double distanceBetween(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    @Transactional(readOnly = true)
    public PaginatedData<VenueListItemResponse> listVenues(
            int page,
            int limit,
            Integer sportId,
            String city,
            String search,
            Double latitude,
            Double longitude,
            Double radiusKm,
            String sortBy
    ) {
        int safePage = Math.max(1, page);
        int safeLimit = Math.min(100, Math.max(1, limit));
        double effectiveRadius = (radiusKm != null && radiusKm > 0) ? radiusKm : 10.0;

        List<Venue> venues = venueRepository.findActiveWithSportAndAmenities("active");
        if (venues.isEmpty()) {
            venues = venueRepository.findByStatus("active");
        }

        if (city != null && !city.trim().isEmpty()) {
            String lowerCity = city.trim().toLowerCase();
            venues = venues.stream()
                    .filter(v -> v.getCity() != null && v.getCity().toLowerCase().contains(lowerCity))
                    .collect(Collectors.toList());
        }

        if (sportId != null) {
            venues = venues.stream()
                    .filter(v -> v.getSport() != null && v.getSport().getId().equals(sportId))
                    .collect(Collectors.toList());
        }

        if (search != null && !search.trim().isEmpty()) {
            String lowerSearch = search.trim().toLowerCase();
            venues = venues.stream()
                    .filter(v -> (v.getName() != null && v.getName().toLowerCase().contains(lowerSearch))
                            || (v.getDescription() != null && v.getDescription().toLowerCase().contains(lowerSearch)))
                    .collect(Collectors.toList());
        }

        List<UUID> allVenueIds = venues.stream().map(Venue::getId).collect(Collectors.toList());
        Map<UUID, List<Review>> reviewsByVenue = allVenueIds.isEmpty() ? Collections.emptyMap() :
                reviewRepository.findByVenueIdIn(allVenueIds).stream()
                        .filter(r -> r.getVenue() != null)
                        .collect(Collectors.groupingBy(r -> r.getVenue().getId()));

        Map<UUID, List<VenueImage>> imagesByVenue = allVenueIds.isEmpty() ? Collections.emptyMap() :
                venueImageRepository.findByVenueIdInOrderByIsPrimaryDescSortOrderAsc(allVenueIds).stream()
                        .filter(img -> img.getVenue() != null)
                        .collect(Collectors.groupingBy(img -> img.getVenue().getId()));

        List<VenueListItemResponse> enriched = new ArrayList<>();
        for (Venue v : venues) {
            VenueListItemResponse item = new VenueListItemResponse();
            populateBaseItemWithData(v, item, reviewsByVenue.get(v.getId()), imagesByVenue.get(v.getId()));

            if (latitude != null && longitude != null) {
                if (v.getLatitude() != null && v.getLongitude() != null) {
                    double dist = distanceBetween(latitude, longitude, v.getLatitude(), v.getLongitude());
                    if (dist > effectiveRadius) {
                        continue;
                    }
                    item.setDistance(String.format(Locale.US, "%.1f", dist));
                }
            }

            enriched.add(item);
        }

        enriched.sort((a, b) -> {
            if ("price".equalsIgnoreCase(sortBy)) {
                return a.getPricePerHour().compareTo(b.getPricePerHour());
            } else if ("distance".equalsIgnoreCase(sortBy)) {
                if (a.getDistance() == null && b.getDistance() == null) return 0;
                if (a.getDistance() == null) return 1;
                if (b.getDistance() == null) return -1;
                return Double.compare(Double.parseDouble(a.getDistance()), Double.parseDouble(b.getDistance()));
            } else if ("newest".equalsIgnoreCase(sortBy)) {
                if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            } else {
                double rA = a.getAverageRating() != null ? Double.parseDouble(a.getAverageRating()) : 0.0;
                double rB = b.getAverageRating() != null ? Double.parseDouble(b.getAverageRating()) : 0.0;
                return Double.compare(rB, rA);
            }
        });

        int total = enriched.size();
        int offset = (safePage - 1) * safeLimit;
        List<VenueListItemResponse> paginated;
        if (offset >= total) {
            paginated = Collections.emptyList();
        } else {
            paginated = enriched.subList(offset, Math.min(offset + safeLimit, total));
        }

        int pages = (int) Math.ceil((double) total / safeLimit);
        return new PaginatedData<>(paginated, safePage, safeLimit, total, pages);
    }

    @Override
    @Transactional(readOnly = true)
    public VenueDetailResponse getVenueDetail(UUID id) {
        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Venue"));

        VenueDetailResponse detail = new VenueDetailResponse();
        populateBaseItem(venue, detail);

        List<VenueImage> images = venueImageRepository.findByVenueIdOrderByIsPrimaryDescSortOrderAsc(venue.getId());
        detail.setImages(images.stream()
                .map(img -> new VenueImageResponse(
                        img.getId().toString(),
                        img.getUrl(),
                        img.getStorageKey(),
                        img.isPrimary(),
                        img.getSortOrder()
                ))
                .collect(Collectors.toList()));

        User owner = venue.getOwner();
        OwnerProfile profile = ownerProfileRepository.findByUserId(owner.getId()).orElse(null);
        OwnerSummaryResponse.OwnerProfileSummary profileSummary = profile != null
                ? new OwnerSummaryResponse.OwnerProfileSummary(profile.getBusinessName(), profile.getGstNumber(), profile.isApproved())
                : null;
        OwnerSummaryResponse ownerSummary = new OwnerSummaryResponse(
                owner.getId().toString(),
                owner.getName(),
                owner.getEmail(),
                owner.getPhone(),
                owner.getAvatarUrl(),
                profileSummary
        );
        detail.setOwner(ownerSummary);

        List<Review> reviews = reviewRepository.findByVenueIdOrderByCreatedAtDesc(venue.getId());
        detail.setReviews(reviews.stream()
                .map(r -> new ReviewResponse(
                        r.getId().toString(),
                        r.getRating(),
                        r.getComment(),
                        r.getCreatedAt(),
                        new ReviewResponse.UserSummary(
                                r.getUser().getId().toString(),
                                r.getUser().getName(),
                                r.getUser().getAvatarUrl()
                        )
                ))
                .collect(Collectors.toList()));

        ownerUpiQrRepository.findFirstByVenueIdAndIsActiveTrue(venue.getId())
                .or(() -> ownerUpiQrRepository.findFirstByOwnerIdAndIsActiveTrue(owner.getId()))
                .ifPresent(qr -> {
                    detail.setUpiId(qr.getUpiId());
                    detail.setQrImageUrl(qr.getQrImageUrl());
                });

        return detail;
    }

    @Override
    public VenueDetailResponse createVenue(UUID ownerId, CreateVenueRequest req) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> AppException.unauthorized("User not found"));

        boolean isOwner = (owner.getRole() != null && owner.getRole().getId() == 2)
                || (owner.getRole() != null && "ROLE_OWNER".equalsIgnoreCase(owner.getRole().getName()))
                || (owner.getRole() != null && "owner".equalsIgnoreCase(owner.getRole().getName()));

        if (!isOwner) {
            throw AppException.forbidden("Only owners can create venues");
        }

        if (req.getSportIds() == null || req.getSportIds().isEmpty()) {
            throw AppException.badRequest("Select at least one sport");
        }

        Sport sport = sportRepository.findById(req.getSportIds().get(0))
                .orElseThrow(() -> AppException.badRequest("Selected sport does not exist"));

        Venue venue = new Venue();
        venue.setOwner(owner);
        venue.setSport(sport);
        venue.setName(req.getName());
        venue.setDescription(req.getDescription());
        venue.setAddress(req.getAddress());
        venue.setCity(req.getCity());
        venue.setState(req.getState());
        venue.setPincode(req.getPincode());
        venue.setLatitude(req.getLatitude());
        venue.setLongitude(req.getLongitude());
        venue.setPricePerHour(req.getPricePerHour());
        venue.setPhone(req.getPhone());
        venue.setStatus("active");
        venue.setVerified(true);

        if (req.getAmenityIds() != null && !req.getAmenityIds().isEmpty()) {
            List<Amenity> amenities = amenityRepository.findAllById(req.getAmenityIds());
            venue.setAmenities(new HashSet<>(amenities));
        }

        Venue saved = venueRepository.save(venue);
        return getVenueDetail(saved.getId());
    }

    @Override
    public VenueDetailResponse updateVenue(UUID venueId, UUID userId, boolean isAdmin, UpdateVenueRequest req) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> AppException.notFound("Venue"));

        if (!isAdmin && !venue.getOwner().getId().equals(userId)) {
            throw AppException.forbidden("You do not own this venue");
        }

        if (req.getName() != null) venue.setName(req.getName());
        if (req.getDescription() != null) venue.setDescription(req.getDescription());
        if (req.getPricePerHour() != null) venue.setPricePerHour(req.getPricePerHour());
        if (req.getPhone() != null) venue.setPhone(req.getPhone());
        if (req.getAddress() != null) venue.setAddress(req.getAddress());
        if (req.getCity() != null) venue.setCity(req.getCity());
        if (req.getState() != null) venue.setState(req.getState());
        if (req.getPincode() != null) venue.setPincode(req.getPincode());

        if (req.getSportIds() != null && !req.getSportIds().isEmpty()) {
            Sport sport = sportRepository.findById(req.getSportIds().get(0))
                    .orElseThrow(() -> AppException.badRequest("Selected sport does not exist"));
            venue.setSport(sport);
        }

        if (req.getIsActive() != null) {
            venue.setStatus(req.getIsActive() ? "active" : "suspended");
        }

        if (req.getAmenityIds() != null) {
            List<Amenity> amenities = amenityRepository.findAllById(req.getAmenityIds());
            venue.setAmenities(new HashSet<>(amenities));
        }

        Venue saved = venueRepository.save(venue);
        return getVenueDetail(saved.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SportResponse> getSports() {
        return sportRepository.findAllByOrderByNameAsc().stream()
                .map(s -> new SportResponse(s.getId(), s.getName(), s.getIconUrl()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AmenityResponse> getAmenities() {
        return amenityRepository.findAllByOrderByNameAsc().stream()
                .map(a -> new AmenityResponse(a.getId(), a.getName(), a.getIcon()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<VenueListItemResponse> getOwnerVenues(UUID ownerId) {
        List<Venue> venues = venueRepository.findByOwnerIdOrderByCreatedAtDesc(ownerId);
        if (venues.isEmpty()) return Collections.emptyList();

        List<UUID> venueIds = venues.stream().map(Venue::getId).collect(Collectors.toList());
        Map<UUID, List<Review>> reviewsByVenue = reviewRepository.findByVenueIdIn(venueIds).stream()
                .filter(r -> r.getVenue() != null)
                .collect(Collectors.groupingBy(r -> r.getVenue().getId()));

        Map<UUID, List<VenueImage>> imagesByVenue = venueImageRepository.findByVenueIdInOrderByIsPrimaryDescSortOrderAsc(venueIds).stream()
                .filter(img -> img.getVenue() != null)
                .collect(Collectors.groupingBy(img -> img.getVenue().getId()));

        return venues.stream().map(v -> {
            VenueListItemResponse item = new VenueListItemResponse();
            populateBaseItemWithData(v, item, reviewsByVenue.get(v.getId()), imagesByVenue.get(v.getId()));
            return item;
        }).collect(Collectors.toList());
    }

    private VenueListItemResponse mapToListItem(Venue venue) {
        VenueListItemResponse item = new VenueListItemResponse();
        populateBaseItem(venue, item);
        return item;
    }

    private void populateBaseItem(Venue venue, VenueListItemResponse item) {
        List<Review> reviews = reviewRepository.findByVenueIdOrderByCreatedAtDesc(venue.getId());
        List<VenueImage> images = venueImageRepository.findByVenueIdOrderByIsPrimaryDescSortOrderAsc(venue.getId());
        populateBaseItemWithData(venue, item, reviews, images);
    }

    private void populateBaseItemWithData(Venue venue, VenueListItemResponse item, List<Review> reviews, List<VenueImage> images) {
        item.setId(venue.getId().toString());
        item.setName(venue.getName());
        item.setDescription(venue.getDescription());
        item.setAddress(venue.getAddress());
        item.setCity(venue.getCity());
        item.setState(venue.getState());
        item.setPincode(venue.getPincode());
        item.setLatitude(venue.getLatitude());
        item.setLongitude(venue.getLongitude());
        item.setPricePerHour(venue.getPricePerHour());
        item.setPhone(venue.getPhone());
        item.setStatus(venue.getStatus());
        item.setVerified(venue.isVerified());
        item.setActive("active".equalsIgnoreCase(venue.getStatus()));
        item.setCreatedAt(venue.getCreatedAt());

        if (venue.getSport() != null) {
            item.setSports(List.of(new SportResponse(
                    venue.getSport().getId(),
                    venue.getSport().getName(),
                    venue.getSport().getIconUrl()
            )));
        } else {
            item.setSports(Collections.emptyList());
        }

        if (venue.getAmenities() != null) {
            item.setAmenities(venue.getAmenities().stream()
                    .map(a -> new AmenityResponse(a.getId(), a.getName(), a.getIcon()))
                    .collect(Collectors.toList()));
        } else {
            item.setAmenities(Collections.emptyList());
        }

        if (reviews != null && !reviews.isEmpty()) {
            double avg = reviews.stream().mapToInt(Review::getRating).average().orElse(0.0);
            item.setAverageRating(String.format(Locale.US, "%.1f", avg));
            item.setReviewCount(reviews.size());
            item.setAvgRating(BigDecimal.valueOf(avg));
            item.setTotalReviews(reviews.size());
        } else {
            item.setAverageRating(null);
            item.setReviewCount(0);
            item.setAvgRating(BigDecimal.ZERO);
            item.setTotalReviews(0);
        }

        if (images != null && !images.isEmpty()) {
            item.setPreviewImage(images.get(0).getUrl());
            item.setImages(images.stream()
                    .map(img -> new VenueImageResponse(
                            img.getId().toString(),
                            img.getUrl(),
                            img.getStorageKey(),
                            img.isPrimary(),
                            img.getSortOrder()
                    ))
                    .collect(Collectors.toList()));
        } else {
            item.setPreviewImage(null);
            item.setImages(Collections.emptyList());
        }
    }

    @Override
    public List<VenueImageResponse> uploadVenueImages(UUID venueId, UUID userId, boolean isAdmin, org.springframework.web.multipart.MultipartFile[] files) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> AppException.notFound("Venue"));

        if (!isAdmin && !venue.getOwner().getId().equals(userId)) {
            throw AppException.forbidden("You do not own this venue");
        }

        if (files == null || files.length == 0) {
            throw new AppException("No images provided", org.springframework.http.HttpStatus.BAD_REQUEST, "EMPTY_FILES");
        }

        List<VenueImage> existingImages = venueImageRepository.findByVenueIdOrderByIsPrimaryDescSortOrderAsc(venueId);
        if (existingImages.size() + files.length > 8) {
            throw new AppException("Maximum 8 images allowed per venue", org.springframework.http.HttpStatus.BAD_REQUEST, "IMAGE_LIMIT_EXCEEDED");
        }

        int currentMaxOrder = existingImages.stream().mapToInt(VenueImage::getSortOrder).max().orElse(-1);
        boolean hasPrimary = existingImages.stream().anyMatch(VenueImage::isPrimary);

        for (int i = 0; i < files.length; i++) {
            org.springframework.web.multipart.MultipartFile file = files[i];
            com.slotplay.dto.UploadResult result = storageService.upload(file, "venue-images");

            boolean isPrimary = !hasPrimary && (i == 0);
            if (isPrimary) {
                hasPrimary = true;
            }

            VenueImage img = new VenueImage(
                    venue,
                    result.getUrl(),
                    result.getKey(),
                    isPrimary,
                    currentMaxOrder + 1 + i
            );
            venueImageRepository.save(img);
        }

        return venueImageRepository.findByVenueIdOrderByIsPrimaryDescSortOrderAsc(venueId).stream()
                .map(img -> new VenueImageResponse(img.getId().toString(), img.getUrl(), img.getStorageKey(), img.isPrimary(), img.getSortOrder()))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteVenueImage(UUID venueId, UUID imageId, UUID userId, boolean isAdmin) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> AppException.notFound("Venue"));

        if (!isAdmin && !venue.getOwner().getId().equals(userId)) {
            throw AppException.forbidden("You do not own this venue");
        }

        VenueImage targetImage = venueImageRepository.findById(imageId)
                .orElseThrow(() -> AppException.notFound("Image"));

        if (!targetImage.getVenue().getId().equals(venueId)) {
            throw AppException.notFound("Image");
        }

        boolean wasPrimary = targetImage.isPrimary();
        String storageKey = targetImage.getStorageKey();

        venueImageRepository.delete(targetImage);
        storageService.delete(storageKey);

        if (wasPrimary) {
            List<VenueImage> remaining = venueImageRepository.findByVenueIdOrderByIsPrimaryDescSortOrderAsc(venueId);
            if (!remaining.isEmpty()) {
                VenueImage newPrimary = remaining.get(0);
                newPrimary.setPrimary(true);
                venueImageRepository.save(newPrimary);
            }
        }
    }

    @Override
    public void reorderVenueImages(UUID venueId, UUID userId, boolean isAdmin, List<UUID> order) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> AppException.notFound("Venue"));

        if (!isAdmin && !venue.getOwner().getId().equals(userId)) {
            throw AppException.forbidden("You do not own this venue");
        }

        if (order == null) return;

        for (int i = 0; i < order.size(); i++) {
            UUID imgId = order.get(i);
            Optional<VenueImage> opt = venueImageRepository.findById(imgId);
            if (opt.isPresent() && opt.get().getVenue().getId().equals(venueId)) {
                VenueImage img = opt.get();
                img.setSortOrder(i);
                venueImageRepository.save(img);
            }
        }
    }

    @Override
    public void setPrimaryVenueImage(UUID venueId, UUID imageId, UUID userId, boolean isAdmin) {
        Venue venue = venueRepository.findById(venueId)
                .orElseThrow(() -> AppException.notFound("Venue"));

        if (!isAdmin && !venue.getOwner().getId().equals(userId)) {
            throw AppException.forbidden("You do not own this venue");
        }

        List<VenueImage> images = venueImageRepository.findByVenueIdOrderByIsPrimaryDescSortOrderAsc(venueId);
        boolean found = false;
        for (VenueImage img : images) {
            if (img.getId().equals(imageId)) {
                img.setPrimary(true);
                found = true;
            } else {
                img.setPrimary(false);
            }
            venueImageRepository.save(img);
        }

        if (!found) {
            throw AppException.notFound("Image");
        }
    }
}
