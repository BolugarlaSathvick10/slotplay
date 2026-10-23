package com.slotplay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class UpdateVenueStatusRequest {

    @NotNull(message = "isActive is required")
    @JsonProperty("isActive")
    private Boolean isActive;

    public UpdateVenueStatusRequest() {
    }

    public UpdateVenueStatusRequest(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }
}
