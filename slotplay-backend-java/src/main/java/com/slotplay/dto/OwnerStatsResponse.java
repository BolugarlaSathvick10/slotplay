package com.slotplay.dto;

import java.math.BigDecimal;

public class OwnerStatsResponse {

    private long totalBookings;
    private long confirmedBookings;
    private long pendingPayments;
    private BigDecimal totalRevenue;
    private long totalVenues;

    public OwnerStatsResponse() {
    }

    public OwnerStatsResponse(long totalBookings, long confirmedBookings, long pendingPayments, BigDecimal totalRevenue, long totalVenues) {
        this.totalBookings = totalBookings;
        this.confirmedBookings = confirmedBookings;
        this.pendingPayments = pendingPayments;
        this.totalRevenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
        this.totalVenues = totalVenues;
    }

    public long getTotalBookings() {
        return totalBookings;
    }

    public void setTotalBookings(long totalBookings) {
        this.totalBookings = totalBookings;
    }

    public long getConfirmedBookings() {
        return confirmedBookings;
    }

    public void setConfirmedBookings(long confirmedBookings) {
        this.confirmedBookings = confirmedBookings;
    }

    public long getPendingPayments() {
        return pendingPayments;
    }

    public void setPendingPayments(long pendingPayments) {
        this.pendingPayments = pendingPayments;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }

    public long getTotalVenues() {
        return totalVenues;
    }

    public void setTotalVenues(long totalVenues) {
        this.totalVenues = totalVenues;
    }
}
