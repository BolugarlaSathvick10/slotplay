package com.slotplay.service;

import com.slotplay.dto.*;

import java.util.List;
import java.util.UUID;

public interface VenueService {

    PaginatedData<VenueListItemResponse> listVenues(
            int page,
            int limit,
            Integer sportId,
            String city,
            String search,
            Double latitude,
            Double longitude,
            Double radiusKm,
            String sortBy
    );

    VenueDetailResponse getVenueDetail(UUID id);

    VenueDetailResponse createVenue(UUID ownerId, CreateVenueRequest req);

    VenueDetailResponse updateVenue(UUID venueId, UUID userId, boolean isAdmin, UpdateVenueRequest req);

    List<SportResponse> getSports();

    List<AmenityResponse> getAmenities();

    List<VenueListItemResponse> getOwnerVenues(UUID ownerId);

    List<VenueImageResponse> uploadVenueImages(UUID venueId, UUID userId, boolean isAdmin, org.springframework.web.multipart.MultipartFile[] files);

    void deleteVenueImage(UUID venueId, UUID imageId, UUID userId, boolean isAdmin);

    void reorderVenueImages(UUID venueId, UUID userId, boolean isAdmin, List<UUID> order);

    void setPrimaryVenueImage(UUID venueId, UUID imageId, UUID userId, boolean isAdmin);
}
