package com.slotplay.dto;

import java.time.Instant;

public class ReviewResponse {

    private String id;
    private int rating;
    private String comment;
    private Instant createdAt;
    private UserSummary user;

    public ReviewResponse() {
    }

    public ReviewResponse(String id, int rating, String comment, Instant createdAt, UserSummary user) {
        this.id = id;
        this.rating = rating;
        this.comment = comment;
        this.createdAt = createdAt;
        this.user = user;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getRating() {
        return rating;
    }

    public void setRating(int rating) {
        this.rating = rating;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public UserSummary getUser() {
        return user;
    }

    public void setUser(UserSummary user) {
        this.user = user;
    }

    public static class UserSummary {
        private String id;
        private String name;
        private String avatarUrl;

        public UserSummary() {
        }

        public UserSummary(String id, String name, String avatarUrl) {
            this.id = id;
            this.name = name;
            this.avatarUrl = avatarUrl;
        }

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getAvatarUrl() {
            return avatarUrl;
        }

        public void setAvatarUrl(String avatarUrl) {
            this.avatarUrl = avatarUrl;
        }
    }
}
