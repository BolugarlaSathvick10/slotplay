package com.slotplay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

public class UpdateUserVerifyRequest {

    @NotNull(message = "isVerified is required")
    @JsonProperty("isVerified")
    private Boolean isVerified;

    public UpdateUserVerifyRequest() {
    }

    public UpdateUserVerifyRequest(Boolean isVerified) {
        this.isVerified = isVerified;
    }

    @JsonProperty("isVerified")
    public Boolean getIsVerified() {
        return isVerified;
    }

    @JsonProperty("isVerified")
    public void setIsVerified(Boolean isVerified) {
        this.isVerified = isVerified;
    }
}
