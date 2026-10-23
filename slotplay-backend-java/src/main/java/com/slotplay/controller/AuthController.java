package com.slotplay.controller;

import com.slotplay.dto.*;
import com.slotplay.security.UserPrincipal;
import com.slotplay.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> register(
            @Valid @RequestBody RegisterRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        RegisterResponse data = authService.register(req, request, response);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(data, "Account created. Please check your email for a verification code."));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthUserResponse>> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        AuthUserResponse data = authService.login(req, request, response);
        return ResponseEntity.ok(ApiResponse.success(data, "Logged in successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        authService.logout(request, response);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<AuthUserResponse>> getMe(
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        AuthUserResponse data = authService.getMe(principal);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthUserResponse>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        AuthUserResponse data = authService.verifyOtp(req, request, response);
        return ResponseEntity.ok(ApiResponse.success(data, "Email verified successfully"));
    }

    @PostMapping("/verify-otp-email")
    public ResponseEntity<ApiResponse<AuthUserResponse>> verifyOtpByEmail(
            @Valid @RequestBody VerifyOtpByEmailRequest req,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        AuthUserResponse data = authService.verifyOtpByEmail(req, request, response);
        return ResponseEntity.ok(ApiResponse.success(data, "Email verified successfully"));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Void>> resendOtp(
            @Valid @RequestBody ResendOtpRequest req
    ) {
        authService.resendOtp(req);
        return ResponseEntity.ok(ApiResponse.success(null, "If that email is registered and unverified, a new code has been sent."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest req
    ) {
        authService.forgotPassword(req);
        return ResponseEntity.ok(ApiResponse.success(null, "If that email is registered, a password reset code has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest req
    ) {
        authService.resetPassword(req);
        return ResponseEntity.ok(ApiResponse.success(null, "Password reset successfully. Please log in."));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<AuthUserResponse>> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest req
    ) {
        AuthUserResponse data = authService.updateProfile(principal, req);
        return ResponseEntity.ok(ApiResponse.success(data, "Profile updated successfully"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest req
    ) {
        authService.changePassword(principal, req);
        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    }
}
