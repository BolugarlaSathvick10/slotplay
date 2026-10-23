package com.slotplay.service;

import com.slotplay.dto.CreateSlotRequest;
import com.slotplay.dto.GenerateSlotsRequest;
import com.slotplay.dto.SlotItemResponse;
import com.slotplay.dto.SlotWithAvailabilityResponse;

import java.util.List;
import java.util.UUID;

public interface SlotService {

    List<SlotWithAvailabilityResponse> getSlotsByDate(UUID venueId, String dateStr);

    List<SlotItemResponse> generateSlots(UUID venueId, UUID ownerId, boolean isAdmin, GenerateSlotsRequest req);

    SlotItemResponse createSlot(UUID venueId, UUID ownerId, boolean isAdmin, CreateSlotRequest req);

    boolean isSlotAvailable(UUID slotId);
}
