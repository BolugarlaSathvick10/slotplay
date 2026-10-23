package com.slotplay.dto;

import java.math.BigDecimal;

public class QrTicketPayload {

    private String ref;
    private String venue;
    private String slot;
    private BigDecimal amount;

    public QrTicketPayload() {
    }

    public QrTicketPayload(String ref, String venue, String slot, BigDecimal amount) {
        this.ref = ref;
        this.venue = venue;
        this.slot = slot;
        this.amount = amount;
    }

    public String getRef() {
        return ref;
    }

    public void setRef(String ref) {
        this.ref = ref;
    }

    public String getVenue() {
        return venue;
    }

    public void setVenue(String venue) {
        this.venue = venue;
    }

    public String getSlot() {
        return slot;
    }

    public void setSlot(String slot) {
        this.slot = slot;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }
}
