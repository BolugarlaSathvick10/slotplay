package com.slotplay.dto;

import java.math.BigDecimal;

public class AdminStatsResponse {

    private long totalUsers;
    private long totalVenues;
    private long totalBookings;
    private long confirmedBookings;
    private long pendingVerifications;
    private BigDecimal totalRevenue;

    public AdminStatsResponse() {
    }

    public AdminStatsResponse(long totalUsers, long totalVenues, long totalBookings, long confirmedBookings, long pendingVerifications, BigDecimal totalRevenue) {
        this.totalUsers = totalUsers;
        this.totalVenues = totalVenues;
        this.totalBookings = totalBookings;
        this.confirmedBookings = confirmedBookings;
        this.pendingVerifications = pendingVerifications;
        this.totalRevenue = totalRevenue != null ? totalRevenue : BigDecimal.ZERO;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public void setTotalUsers(long totalUsers) {
        this.totalUsers = totalUsers;
    }

    public long getTotalVenues() {
        return totalVenues;
    }

    public void setTotalVenues(long totalVenues) {
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

    public long getPendingVerifications() {
        return pendingVerifications;
    }

    public void setPendingVerifications(long pendingVerifications) {
        this.pendingVerifications = pendingVerifications;
    }

    public BigDecimal getTotalRevenue() {
        return totalRevenue;
    }

    public void setTotalRevenue(BigDecimal totalRevenue) {
        this.totalRevenue = totalRevenue;
    }
}
