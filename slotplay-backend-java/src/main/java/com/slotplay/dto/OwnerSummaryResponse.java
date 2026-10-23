package com.slotplay.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class OwnerSummaryResponse {

    private String id;
    private String name;
    private String email;
    private String phone;
    private String avatarUrl;
    private OwnerProfileSummary ownerProfile;

    public OwnerSummaryResponse() {
    }

    public OwnerSummaryResponse(String id, String name, String email, String phone, String avatarUrl, OwnerProfileSummary ownerProfile) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.avatarUrl = avatarUrl;
        this.ownerProfile = ownerProfile;
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

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public OwnerProfileSummary getOwnerProfile() {
        return ownerProfile;
    }

    public void setOwnerProfile(OwnerProfileSummary ownerProfile) {
        this.ownerProfile = ownerProfile;
    }

    public String getBusinessName() {
        return ownerProfile != null ? ownerProfile.getBusinessName() : null;
    }

    public String getGstNumber() {
        return ownerProfile != null ? ownerProfile.getGstNumber() : null;
    }

    public Boolean getIsApproved() {
        return ownerProfile != null ? ownerProfile.isApproved() : null;
    }

    public static class OwnerProfileSummary {
        private String businessName;
        private String gstNumber;
        private boolean isApproved;

        public OwnerProfileSummary() {
        }

        public OwnerProfileSummary(String businessName, String gstNumber, boolean isApproved) {
            this.businessName = businessName;
            this.gstNumber = gstNumber;
            this.isApproved = isApproved;
        }

        public String getBusinessName() {
            return businessName;
        }

        public void setBusinessName(String businessName) {
            this.businessName = businessName;
        }

        public String getGstNumber() {
            return gstNumber;
        }

        public void setGstNumber(String gstNumber) {
            this.gstNumber = gstNumber;
        }

        public boolean isApproved() {
            return isApproved;
        }

        public void setApproved(boolean approved) {
            isApproved = approved;
        }
    }
}
