package com.slotplay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class NotificationResponse {

    private String id;
    private String type;
    private String title;
    private String body;
    @JsonProperty("isRead")
    private boolean isRead;
    private Instant createdAt;

    public NotificationResponse() {
    }

    public NotificationResponse(String id, String type, String title, String body, boolean isRead, Instant createdAt) {
        this.id = id;
        this.type = type;
        this.title = title;
        this.body = body;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    @JsonProperty("isRead")
    public boolean isRead() {
        return isRead;
    }

    @JsonProperty("isRead")
    public void setRead(boolean read) {
        isRead = read;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
