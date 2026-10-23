package com.slotplay.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @Size(min = 2, max = 120, message = "Name must be between 2 and 120 characters")
    @Pattern(regexp = "^[a-zA-Z\\s'-]*$", message = "Name contains invalid characters")
    private String name;

    @Pattern(regexp = "^$|^[6-9]\\d{9}$", message = "Please enter a valid 10-digit Indian mobile number")
    private String phone;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String name, String phone) {
        this.name = name;
        this.phone = phone;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
