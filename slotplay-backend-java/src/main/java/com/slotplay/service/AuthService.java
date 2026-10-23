package com.slotplay.service;

import com.slotplay.dto.*;
import com.slotplay.security.UserPrincipal;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public interface AuthService {

    RegisterResponse register(RegisterRequest req, HttpServletRequest request, HttpServletResponse response);

    AuthUserResponse login(LoginRequest req, HttpServletRequest request, HttpServletResponse response);

    void logout(HttpServletRequest request, HttpServletResponse response);

    AuthUserResponse getMe(UserPrincipal principal);

    AuthUserResponse verifyOtp(VerifyOtpRequest req, HttpServletRequest request, HttpServletResponse response);

    AuthUserResponse verifyOtpByEmail(VerifyOtpByEmailRequest req, HttpServletRequest request, HttpServletResponse response);

    void resendOtp(ResendOtpRequest req);

    void forgotPassword(ForgotPasswordRequest req);

    void resetPassword(ResetPasswordRequest req);

    AuthUserResponse updateProfile(UserPrincipal principal, UpdateProfileRequest req);

    void changePassword(UserPrincipal principal, ChangePasswordRequest req);
}
