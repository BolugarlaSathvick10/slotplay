package com.slotplay.dto;

import java.math.BigDecimal;

public class AdminReportsResponse {

    private long users;
    private long venues;
    private long bookings;
    private BigDecimal revenue;

    public AdminReportsResponse() {
    }

    public AdminReportsResponse(long users, long venues, long bookings, BigDecimal revenue) {
        this.users = users;
        this.venues = venues;
        this.bookings = bookings;
        this.revenue = revenue;
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
}
