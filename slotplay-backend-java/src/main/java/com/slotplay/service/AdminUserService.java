package com.slotplay.service;

import com.slotplay.dto.AdminUserResponse;
import com.slotplay.dto.PaginatedData;

import java.util.UUID;

public interface AdminUserService {

    PaginatedData<AdminUserResponse> listUsers(int page, int limit, String search);

    AdminUserResponse updateUserRole(UUID userId, int roleId);

    AdminUserResponse updateUserVerification(UUID userId, boolean isVerified);
}
