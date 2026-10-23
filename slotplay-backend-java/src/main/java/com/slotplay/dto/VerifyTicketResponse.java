package com.slotplay.dto;

public class VerifyTicketResponse {

    private boolean valid;
    private String message;
    private QrTicketPayload ticket;
    private BookingDetailResponse booking;

    public VerifyTicketResponse() {
    }

    public VerifyTicketResponse(boolean valid, String message, QrTicketPayload ticket, BookingDetailResponse booking) {
        this.valid = valid;
        this.message = message;
        this.ticket = ticket;
        this.booking = booking;
    }

    public boolean isValid() {
        return valid;
    }

    public void setValid(boolean valid) {
        this.valid = valid;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public QrTicketPayload getTicket() {
        return ticket;
    }

    public void setTicket(QrTicketPayload ticket) {
        this.ticket = ticket;
    }

    public BookingDetailResponse getBooking() {
        return booking;
    }

    public void setBooking(BookingDetailResponse booking) {
        this.booking = booking;
    }
}
