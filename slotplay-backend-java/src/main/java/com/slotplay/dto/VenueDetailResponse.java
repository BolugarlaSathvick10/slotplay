package com.slotplay.dto;

import java.util.ArrayList;
import java.util.List;

public class VenueDetailResponse extends VenueListItemResponse {

    private OwnerSummaryResponse owner;
    private List<ReviewResponse> reviews = new ArrayList<>();
    private String upiId;
    private String qrImageUrl;

    public VenueDetailResponse() {
    }

    public OwnerSummaryResponse getOwner() {
        return owner;
    }

    public void setOwner(OwnerSummaryResponse owner) {
        this.owner = owner;
    }

    public List<ReviewResponse> getReviews() {
        return reviews;
    }

    public void setReviews(List<ReviewResponse> reviews) {
        this.reviews = reviews;
    }

    public String getUpiId() {
        return upiId;
    }

    public void setUpiId(String upiId) {
        this.upiId = upiId;
    }

    public String getQrImageUrl() {
        return qrImageUrl;
    }

    public void setQrImageUrl(String qrImageUrl) {
        this.qrImageUrl = qrImageUrl;
    }
}
