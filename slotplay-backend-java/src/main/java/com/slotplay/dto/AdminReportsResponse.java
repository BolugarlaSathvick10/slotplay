package com.slotplay.dto;

import java.math.BigDecimal;

public class AdminReportsResponse {

    private long users;
    private long venues;
    private long bookings;
    private BigDecimal revenue;
    private long confirmedBookings;
    private long pendingVerifications;
    private long pendingPayments;
    private long cancelledBookings;
    private long rejectedBookings;
    private long totalVenuesActive;
    private long totalVenuesSuspended;

    public AdminReportsResponse() {
    }

    public AdminReportsResponse(long users, long venues, long bookings, BigDecimal revenue) {
        this.users = users;
        this.venues = venues;
        this.bookings = bookings;
        this.revenue = revenue;
    }

    public AdminReportsResponse(long users, long venues, long bookings, BigDecimal revenue,
                                long confirmedBookings, long pendingVerifications, long pendingPayments,
                                long cancelledBookings, long rejectedBookings,
                                long totalVenuesActive, long totalVenuesSuspended) {
        this.users = users;
        this.venues = venues;
        this.bookings = bookings;
        this.revenue = revenue;
        this.confirmedBookings = confirmedBookings;
        this.pendingVerifications = pendingVerifications;
        this.pendingPayments = pendingPayments;
        this.cancelledBookings = cancelledBookings;
        this.rejectedBookings = rejectedBookings;
        this.totalVenuesActive = totalVenuesActive;
        this.totalVenuesSuspended = totalVenuesSuspended;
    }

    public long getUsers() {
        return users;
    }

    public void setUsers(long users) {
        this.users = users;
    }

    public long getVenues() {
        return venues;
    }

    public void setVenues(long venues) {
        this.venues = venues;
    }

    public long getBookings() {
        return bookings;
    }

    public void setBookings(long bookings) {
        this.bookings = bookings;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
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

    public long getPendingPayments() {
        return pendingPayments;
    }

    public void setPendingPayments(long pendingPayments) {
        this.pendingPayments = pendingPayments;
    }

    public long getCancelledBookings() {
        return cancelledBookings;
    }

    public void setCancelledBookings(long cancelledBookings) {
        this.cancelledBookings = cancelledBookings;
    }

    public long getRejectedBookings() {
        return rejectedBookings;
    }

    public void setRejectedBookings(long rejectedBookings) {
        this.rejectedBookings = rejectedBookings;
    }

    public long getTotalVenuesActive() {
        return totalVenuesActive;
    }

    public void setTotalVenuesActive(long totalVenuesActive) {
        this.totalVenuesActive = totalVenuesActive;
    }

    public long getTotalVenuesSuspended() {
        return totalVenuesSuspended;
    }

    public void setTotalVenuesSuspended(long totalVenuesSuspended) {
        this.totalVenuesSuspended = totalVenuesSuspended;
    }
}
