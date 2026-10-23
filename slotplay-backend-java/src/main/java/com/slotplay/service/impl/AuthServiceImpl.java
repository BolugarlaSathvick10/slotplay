package com.slotplay.service.impl;

import com.slotplay.dto.*;
import com.slotplay.entity.OtpToken;
import com.slotplay.entity.Role;
import com.slotplay.entity.User;
import com.slotplay.exception.AppException;
import com.slotplay.repository.OtpTokenRepository;
import com.slotplay.repository.RoleRepository;
import com.slotplay.repository.UserRepository;
import com.slotplay.security.UserPrincipal;
import com.slotplay.service.AuthService;
import com.slotplay.service.EmailService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OtpTokenRepository otpTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final SecurityContextRepository securityContextRepository = new HttpSessionSecurityContextRepository();
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           OtpTokenRepository otpTokenRepository,
                           PasswordEncoder passwordEncoder,
                           EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.otpTokenRepository = otpTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    @Override
    public RegisterResponse register(RegisterRequest req, HttpServletRequest request, HttpServletResponse response) {
        String normalizedEmail = req.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw AppException.conflict("An account with this email already exists");
        }

        Role userRole = roleRepository.findByName("user")
                .orElseGet(() -> roleRepository.save(new Role("user")));

        User user = new User();
        user.setName(req.getName().trim());
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setPhone(req.getPhone() != null && !req.getPhone().isBlank() ? req.getPhone().trim() : null);
        user.setRole(userRole);
        user.setVerified(false);

        User savedUser = userRepository.save(user);
        log.info("[Auth] User registered: id={}, email={}", savedUser.getId(), savedUser.getEmail());

        // Issue verification OTP
        issueAndSendOtp(savedUser, "verify");

        // Populate provisional session for OTP verification endpoint
        HttpSession session = request.getSession(true);
        session.setAttribute("userId", savedUser.getId().toString());
        session.setAttribute("role", savedUser.getRole().getName());
        session.setAttribute("email", savedUser.getEmail());

        return new RegisterResponse(savedUser.getId().toString(), savedUser.getName(), savedUser.getEmail());
    }

    @Override
    @Transactional(noRollbackFor = AppException.class)
    public AuthUserResponse login(LoginRequest req, HttpServletRequest request, HttpServletResponse response) {
        String normalizedEmail = req.getEmail().toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        // Constant-time check to prevent timing attacks
        String dummyHash = "$2a$12$dummy.hash.to.prevent.timing.attacks.padding.xxx";
        String passwordHash = userOpt.map(User::getPasswordHash).orElse(dummyHash);
        boolean isMatch = passwordEncoder.matches(req.getPassword(), passwordHash);

        if (userOpt.isEmpty() || !isMatch) {
            throw new AppException("Invalid email or password", HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS");
        }

        User user = userOpt.get();

        if (!user.isVerified()) {
            HttpSession session = request.getSession(true);
            session.setAttribute("userId", user.getId().toString());
            session.setAttribute("role", user.getRole().getName());
            session.setAttribute("email", user.getEmail());

            issueAndSendOtp(user, "verify");
            throw new AppException(
                    "Please verify your email before logging in. A new verification code has been sent.",
                    HttpStatus.FORBIDDEN,
                    "EMAIL_NOT_VERIFIED"
            );
        }

        authenticateUserInSession(user, request, response);
        log.info("[Auth] User logged in: id={}, email={}", user.getId(), user.getEmail());

        return toAuthUserResponse(user);
    }

    @Override
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }

        SecurityContextHolder.clearContext();

        Cookie cookie = new Cookie("slotplay.sid", "");
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setHttpOnly(true);
        response.addCookie(cookie);

        log.info("[Auth] User logged out successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public AuthUserResponse getMe(UserPrincipal principal) {
        if (principal == null || principal.getId() == null) {
            throw AppException.unauthorized("Not authenticated");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> AppException.notFound("User"));

        return toAuthUserResponse(user);
    }

    @Override
    public AuthUserResponse verifyOtp(VerifyOtpRequest req, HttpServletRequest request, HttpServletResponse response) {
        User user = null;

        // 1. Look up user by email if provided in request
        if (req.getEmail() != null && !req.getEmail().trim().isEmpty()) {
            String normalizedEmail = req.getEmail().trim().toLowerCase();
            user = userRepository.findByEmailIgnoreCase(normalizedEmail).orElse(null);
        }

        // 2. Fall back to session userId if email was not supplied
        if (user == null) {
            HttpSession session = request.getSession(false);
            if (session != null && session.getAttribute("userId") != null) {
                try {
                    UUID userId = UUID.fromString((String) session.getAttribute("userId"));
                    user = userRepository.findById(userId).orElse(null);
                } catch (IllegalArgumentException ignored) {
                }
            }
        }

        if (user == null) {
            throw new AppException("Session expired. Please register again.", HttpStatus.UNAUTHORIZED, "SESSION_EXPIRED");
        }

        // If user is already verified, authenticate and return immediately
        if (user.isVerified()) {
            authenticateUserInSession(user, request, response);
            log.info("[Auth] User already verified: userId={}, email={}", user.getId(), user.getEmail());
            return toAuthUserResponse(user);
        }

        String cleanCode = req.getOtpCode().trim();
        log.info("[Auth] Verifying OTP for email={}, code={}", user.getEmail(), cleanCode);

        Optional<OtpToken> tokenOpt = otpTokenRepository.findTopByUserIdAndOtpCodeAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(
                user.getId(), cleanCode, "verify"
        );
        if (tokenOpt.isEmpty()) {
            log.warn("[Auth] No unused 'verify' token found matching code={} for user={}", cleanCode, user.getEmail());
            throw new AppException("Invalid or expired verification code", HttpStatus.BAD_REQUEST, "INVALID_OTP");
        }

        OtpToken token = tokenOpt.get();
        if (token.getExpiresAt().isBefore(Instant.now())) {
            log.warn("[Auth] Token expired at {} for user={}, code={}", token.getExpiresAt(), user.getEmail(), cleanCode);
            throw new AppException("Invalid or expired verification code", HttpStatus.BAD_REQUEST, "INVALID_OTP");
        }

        token.setUsed(true);
        otpTokenRepository.saveAndFlush(token);

        user.setVerified(true);
        User savedUser = userRepository.saveAndFlush(user);

        authenticateUserInSession(savedUser, request, response);
        log.info("[Auth] Email verified for userId={}, email={}", savedUser.getId(), savedUser.getEmail());

        return toAuthUserResponse(savedUser);
    }

    @Override
    public AuthUserResponse verifyOtpByEmail(VerifyOtpByEmailRequest req, HttpServletRequest request, HttpServletResponse response) {
        String normalizedEmail = req.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> AppException.notFound("User"));

        if (user.isVerified()) {
            authenticateUserInSession(user, request, response);
            log.info("[Auth] User already verified by email route: userId={}, email={}", user.getId(), user.getEmail());
            return toAuthUserResponse(user);
        }

        String cleanCode = req.getOtpCode().trim();
        OtpToken token = otpTokenRepository.findTopByUserIdAndOtpCodeAndPurposeAndIsUsedFalseOrderByCreatedAtDesc(
                user.getId(), cleanCode, "verify"
        ).orElseThrow(() -> new AppException("Invalid or expired verification code", HttpStatus.BAD_REQUEST, "INVALID_OTP"));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new AppException("Invalid or expired verification code", HttpStatus.BAD_REQUEST, "INVALID_OTP");
        }

        token.setUsed(true);
        otpTokenRepository.saveAndFlush(token);

        user.setVerified(true);
        User savedUser = userRepository.saveAndFlush(user);

        authenticateUserInSession(savedUser, request, response);
        log.info("[Auth] Email verified by fallback for email={}", normalizedEmail);

        return toAuthUserResponse(savedUser);
    }

    @Override
    public void resendOtp(ResendOtpRequest req) {
        String normalizedEmail = req.getEmail().toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isEmpty()) {
            return; // Never reveal if email exists
        }

        User user = userOpt.get();
        if (user.isVerified()) {
            throw new AppException("This account is already verified", HttpStatus.BAD_REQUEST, "ALREADY_VERIFIED");
        }

        issueAndSendOtp(user, "verify");
    }

    @Override
    public void forgotPassword(ForgotPasswordRequest req) {
        String normalizedEmail = req.getEmail().toLowerCase().trim();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(normalizedEmail);

        if (userOpt.isEmpty()) {
            return; // Never reveal if email exists
        }

        issueAndSendOtp(userOpt.get(), "reset");
    }

    @Override
    public void resetPassword(ResetPasswordRequest req) {
        if (!req.getNewPassword().equals(req.getConfirmPassword())) {
            throw AppException.badRequest("Passwords do not match");
        }

        String normalizedEmail = req.getEmail().toLowerCase().trim();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new AppException("Invalid reset request", HttpStatus.BAD_REQUEST, "INVALID_RESET"));

        OtpToken token = otpTokenRepository.findTopByUserIdAndOtpCodeAndPurposeAndIsUsedFalseAndExpiresAtAfter(
                user.getId(), req.getOtpCode().trim(), "reset", Instant.now()
        ).orElseThrow(() -> new AppException("Invalid or expired reset code", HttpStatus.BAD_REQUEST, "INVALID_OTP"));

        token.setUsed(true);
        otpTokenRepository.save(token);

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        log.info("[Auth] Password reset successfully for userId={}", user.getId());
    }

    @Override
    public AuthUserResponse updateProfile(UserPrincipal principal, UpdateProfileRequest req) {
        if (principal == null || principal.getId() == null) {
            throw AppException.unauthorized("Not authenticated");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> AppException.notFound("User"));

        if (req.getName() != null && !req.getName().isBlank()) {
            user.setName(req.getName().trim());
        }
        if (req.getPhone() != null) {
            user.setPhone(req.getPhone().isBlank() ? null : req.getPhone().trim());
        }

        User savedUser = userRepository.save(user);
        return toAuthUserResponse(savedUser);
    }

    @Override
    public void changePassword(UserPrincipal principal, ChangePasswordRequest req) {
        if (principal == null || principal.getId() == null) {
            throw AppException.unauthorized("Not authenticated");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> AppException.notFound("User"));

        if (!passwordEncoder.matches(req.getCurrentPassword(), user.getPasswordHash())) {
            throw AppException.badRequest("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
        log.info("[Auth] Password changed for userId={}", user.getId());
    }

    private void issueAndSendOtp(User user, String purpose) {
        otpTokenRepository.invalidatePreviousOtps(user.getId(), purpose);

        int codeInt = secureRandom.nextInt(1_000_000);
        String otpCode = String.format("%06d", codeInt);
        Instant expiresAt = Instant.now().plus(Duration.ofMinutes(10));

        OtpToken token = new OtpToken();
        token.setUser(user);
        token.setOtpCode(otpCode);
        token.setPurpose(purpose);
        token.setExpiresAt(expiresAt);
        token.setUsed(false);

        otpTokenRepository.saveAndFlush(token);

        if ("verify".equalsIgnoreCase(purpose)) {
            emailService.sendVerificationEmail(user.getEmail(), user.getName(), otpCode);
        } else {
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), otpCode);
        }
    }

    private void authenticateUserInSession(User user, HttpServletRequest request, HttpServletResponse response) {
        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities()
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);

        HttpSession session = request.getSession(true);
        session.setAttribute("userId", user.getId().toString());
        session.setAttribute("role", user.getRole().getName());
        session.setAttribute("email", user.getEmail());

        securityContextRepository.saveContext(context, request, response);
    }

    private AuthUserResponse toAuthUserResponse(User user) {
        return new AuthUserResponse(
                user.getId().toString(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole().getId(),
                user.getRole().getName(),
                user.isVerified(),
                user.getAvatarUrl()
        );
    }
}
