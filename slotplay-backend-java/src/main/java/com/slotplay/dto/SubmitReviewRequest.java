package com.slotplay.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class SubmitReviewRequest {

    @NotNull(message = "venueId is required")
    private UUID venueId;

    @NotNull(message = "rating is required")
    @Min(value = 1, message = "Rating must be between 1 and 5")
    @Max(value = 5, message = "Rating must be between 1 and 5")
    private Integer rating;

    private String comment;

    public SubmitReviewRequest() {
    }

    public SubmitReviewRequest(UUID venueId, Integer rating, String comment) {
        this.venueId = venueId;
        this.rating = rating;
        this.comment = comment;
    }

    public UUID getVenueId() {
        return venueId;
    }

    public void setVenueId(UUID venueId) {
        this.venueId = venueId;
    }

    public Integer getRating() {
        return rating;
    }

    public void setRating(Integer rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
