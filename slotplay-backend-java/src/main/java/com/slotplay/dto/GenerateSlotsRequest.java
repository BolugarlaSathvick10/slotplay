package com.slotplay.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

public class GenerateSlotsRequest {

    @NotNull(message = "venueId is required")
    private UUID venueId;

    @NotNull(message = "fromDate is required")
    private String fromDate;

    @NotNull(message = "toDate is required")
    private String toDate;

    private Integer openHour = 6;
    private Integer closeHour = 22;
    private Integer slotDurationMinutes = 60;
    private BigDecimal pricePerHour;

    public GenerateSlotsRequest() {
    }

    public UUID getVenueId() {
        return venueId;
    }

    public void setVenueId(UUID venueId) {
        this.venueId = venueId;
    }

    public String getFromDate() {
        return fromDate;
    }

    public void setFromDate(String fromDate) {
        this.fromDate = fromDate;
    }

    public String getToDate() {
        return toDate;
    }

    public void setToDate(String toDate) {
        this.toDate = toDate;
    }

    public Integer getOpenHour() {
        return openHour != null ? openHour : 6;
    }

    public void setOpenHour(Integer openHour) {
        this.openHour = openHour;
    }

    public Integer getCloseHour() {
        return closeHour != null ? closeHour : 22;
    }

    public void setCloseHour(Integer closeHour) {
        this.closeHour = closeHour;
    }

    public Integer getSlotDurationMinutes() {
        return slotDurationMinutes != null ? slotDurationMinutes : 60;
    }

    public void setSlotDurationMinutes(Integer slotDurationMinutes) {
        this.slotDurationMinutes = slotDurationMinutes;
    }

    public BigDecimal getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(BigDecimal pricePerHour) {
        this.pricePerHour = pricePerHour;
    }
}
