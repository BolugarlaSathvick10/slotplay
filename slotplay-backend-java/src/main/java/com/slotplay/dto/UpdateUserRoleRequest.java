package com.slotplay.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class UpdateUserRoleRequest {

    @NotNull(message = "roleId is required")
    @Min(value = 1, message = "Invalid roleId")
    @Max(value = 3, message = "Invalid roleId")
    private Integer roleId;

    public UpdateUserRoleRequest() {
    }

    public UpdateUserRoleRequest(Integer roleId) {
        this.roleId = roleId;
    }

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }
}
