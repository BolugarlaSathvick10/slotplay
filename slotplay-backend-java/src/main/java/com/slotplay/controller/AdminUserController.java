package com.slotplay.controller;

import com.slotplay.dto.*;
import com.slotplay.service.AdminUserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    public AdminUserController(AdminUserService adminUserService) {
        this.adminUserService = adminUserService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PaginatedData<AdminUserResponse>>> listUsers(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) String search
    ) {
        PaginatedData<AdminUserResponse> data = adminUserService.listUsers(page, limit, search);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest req
    ) {
        AdminUserResponse updated = adminUserService.updateUserRole(id, req.getRoleId());
        Map<String, Object> payload = Map.of(
                "id", updated.getId(),
                "roleId", updated.getRoleId()
        );
        return ResponseEntity.ok(ApiResponse.success(payload, "Role updated"));
    }

    @PatchMapping("/{id}/verify")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateUserVerification(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserVerifyRequest req
    ) {
        AdminUserResponse updated = adminUserService.updateUserVerification(id, req.getIsVerified());
        Map<String, Object> payload = Map.of(
                "id", updated.getId(),
                "isVerified", updated.isVerified()
        );
        return ResponseEntity.ok(ApiResponse.success(payload, "User updated"));
    }
}
