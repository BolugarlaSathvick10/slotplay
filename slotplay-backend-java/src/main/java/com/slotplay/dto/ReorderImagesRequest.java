package com.slotplay.dto;

import java.util.List;
import java.util.UUID;

public class ReorderImagesRequest {

    private List<UUID> order;

    public ReorderImagesRequest() {
    }

    public ReorderImagesRequest(List<UUID> order) {
        this.order = order;
    }

    public List<UUID> getOrder() {
        return order;
    }

    public void setOrder(List<UUID> order) {
        this.order = order;
    }
}
