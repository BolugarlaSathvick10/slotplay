package com.slotplay.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;

public class AdminUserResponse {

    private String id;
    private String name;
    private String email;
    private String phone;
    private Integer roleId;

    @JsonProperty("isVerified")
    private boolean isVerified;

    private Instant createdAt;

    public AdminUserResponse() {
    }

    public AdminUserResponse(String id, String name, String email, String phone,
                             Integer roleId, boolean isVerified, Instant createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.roleId = roleId;
        this.isVerified = isVerified;
        this.createdAt = createdAt;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }

    @JsonProperty("isVerified")
    public boolean isVerified() {
        return isVerified;
    }

    @JsonProperty("isVerified")
    public void setVerified(boolean isVerified) {
        this.isVerified = isVerified;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
