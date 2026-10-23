package com.slotplay.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.ALWAYS)
public class AuthUserResponse {

    private String id;
    private String name;
    private String email;
    private String phone;
    private Integer roleId;
    private String role;

    @JsonProperty("isVerified")
    private boolean isVerified;

    private String avatarUrl;

    public AuthUserResponse() {
    }

    public AuthUserResponse(String id, String name, String email, String phone,
                            Integer roleId, String role, boolean isVerified, String avatarUrl) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.roleId = roleId;
        this.role = role;
        this.isVerified = isVerified;
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

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    @JsonProperty("isVerified")
    public boolean isVerified() {
        return isVerified;
    }

    @JsonProperty("isVerified")
    public void setVerified(boolean isVerified) {
        this.isVerified = isVerified;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }
}
