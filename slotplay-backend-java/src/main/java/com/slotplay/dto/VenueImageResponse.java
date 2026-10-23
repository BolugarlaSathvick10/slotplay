package com.slotplay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class VenueImageResponse {

    private String id;
    private String url;
    private String storageKey;

    @JsonProperty("isPrimary")
    private boolean isPrimary;

    private int sortOrder;

    public VenueImageResponse() {
    }

    public VenueImageResponse(String id, String url, String storageKey, boolean isPrimary, int sortOrder) {
        this.id = id;
        this.url = url;
        this.storageKey = storageKey;
        this.isPrimary = isPrimary;
        this.sortOrder = sortOrder;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getStorageKey() {
        return storageKey;
    }

    public void setStorageKey(String storageKey) {
        this.storageKey = storageKey;
    }

    @JsonProperty("isPrimary")
    public boolean isPrimary() {
        return isPrimary;
    }

    @JsonProperty("isPrimary")
    public void setPrimary(boolean primary) {
        isPrimary = primary;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }
}
