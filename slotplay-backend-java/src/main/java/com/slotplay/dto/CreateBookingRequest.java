package com.slotplay.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class CreateBookingRequest {

    @NotNull(message = "slotId is required")
    private UUID slotId;

    @NotNull(message = "venueId is required")
    private UUID venueId;

    private String userName;
    private String userEmail;
    private String userPhone;

    public CreateBookingRequest() {
    }

    public CreateBookingRequest(UUID slotId, UUID venueId) {
        this.slotId = slotId;
        this.venueId = venueId;
    }

    public UUID getSlotId() {
        return slotId;
    }

    public void setSlotId(UUID slotId) {
        this.slotId = slotId;
    }

    public UUID getVenueId() {
        return venueId;
    }

    public void setVenueId(UUID venueId) {
        this.venueId = venueId;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public String getUserPhone() {
        return userPhone;
    }

    public void setUserPhone(String userPhone) {
        this.userPhone = userPhone;
    }
}
