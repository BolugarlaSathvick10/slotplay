package com.slotplay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.*;
import com.slotplay.entity.OtpToken;
import com.slotplay.entity.Role;
import com.slotplay.entity.User;
import com.slotplay.repository.OtpTokenRepository;
import com.slotplay.repository.RoleRepository;
import com.slotplay.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Role userRole;

    @BeforeEach
    void setUp() {
        userRole = roleRepository.findByName("user")
                .orElseGet(() -> roleRepository.save(new Role("user")));
    }

    private User createTestUser(String email, String rawPassword, boolean isVerified) {
        User user = new User();
        user.setName("Test User");
        user.setEmail(email.toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(userRole);
        user.setVerified(isVerified);
        return userRepository.save(user);
    }

    private OtpToken createTestOtp(User user, String code, String purpose, boolean isExpired) {
        OtpToken token = new OtpToken();
        token.setUser(user);
        token.setOtpCode(code);
        token.setPurpose(purpose);
        token.setExpiresAt(isExpired ? Instant.now().minus(Duration.ofMinutes(5)) : Instant.now().plus(Duration.ofMinutes(10)));
        token.setUsed(false);
        return otpTokenRepository.save(token);
    }

    @Nested
    @DisplayName("Registration Tests")
    class RegistrationTests {

        @Test
        @DisplayName("Should successfully register user and return 201 with provisional session")
        void registerSuccess() throws Exception {
            RegisterRequest req = new RegisterRequest("Arun Kumar", "arun@example.com", "Password123", "9876543210");

            MvcResult result = mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Account created. Please check your email for a verification code."))
                    .andExpect(jsonPath("$.data.name").value("Arun Kumar"))
                    .andExpect(jsonPath("$.data.email").value("arun@example.com"))
                    .andExpect(jsonPath("$.data.id").isNotEmpty())
                    .andReturn();

            assertNotNull(result.getRequest().getSession(false));
            assertEquals("arun@example.com", result.getRequest().getSession(false).getAttribute("email"));

            User created = userRepository.findByEmailIgnoreCase("arun@example.com").orElse(null);
            assertNotNull(created);
            assertFalse(created.isVerified());
            assertTrue(passwordEncoder.matches("Password123", created.getPasswordHash()));
        }

        @Test
        @DisplayName("Should reject registration with existing email with 409 Conflict")
        void registerDuplicateEmail() throws Exception {
            createTestUser("duplicate@example.com", "Secret123", true);

            RegisterRequest req = new RegisterRequest("Duplicate User", "duplicate@example.com", "Password123", null);

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("CONFLICT"))
                    .andExpect(jsonPath("$.message").value("An account with this email already exists"));
        }

        @Test
        @DisplayName("Should reject registration with invalid fields with 422 Unprocessable Entity")
        void registerInvalidFields() throws Exception {
            // Password missing uppercase and number, invalid email
            RegisterRequest req = new RegisterRequest("A", "invalid-email", "weak", "123");

            mockMvc.perform(post("/api/auth/register")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnprocessableEntity())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
                    .andExpect(jsonPath("$.errors").isMap());
        }
    }

    @Nested
    @DisplayName("Login & Credential Tests")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully with valid credentials and verified user")
        void loginSuccess() throws Exception {
            createTestUser("verified@example.com", "Password123", true);

            LoginRequest req = new LoginRequest("verified@example.com", "Password123");

            MvcResult result = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Logged in successfully"))
                    .andExpect(jsonPath("$.data.email").value("verified@example.com"))
                    .andExpect(jsonPath("$.data.role").value("user"))
                    .andExpect(jsonPath("$.data.roleId").value(userRole.getId()))
                    .andExpect(jsonPath("$.data.isVerified").value(true))
                    .andReturn();

            assertNotNull(result.getRequest().getSession(false));
        }

        @Test
        @DisplayName("Should reject login with invalid password with 401 INVALID_CREDENTIALS")
        void loginInvalidPassword() throws Exception {
            createTestUser("valid@example.com", "CorrectPassword1", true);

            LoginRequest req = new LoginRequest("valid@example.com", "WrongPassword1");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                    .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }

        @Test
        @DisplayName("Should reject login with non-existent email with 401 INVALID_CREDENTIALS")
        void loginNonExistentUser() throws Exception {
            LoginRequest req = new LoginRequest("nobody@example.com", "Password123");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                    .andExpect(jsonPath("$.message").value("Invalid email or password"));
        }

        @Test
        @DisplayName("Should reject login for unverified user with 403 EMAIL_NOT_VERIFIED")
        void loginUnverifiedUser() throws Exception {
            createTestUser("unverified@example.com", "Password123", false);

            LoginRequest req = new LoginRequest("unverified@example.com", "Password123");

            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"))
                    .andExpect(jsonPath("$.message").value("Please verify your email before logging in. A new verification code has been sent."));
        }
    }

    @Nested
    @DisplayName("OTP Verification & Session Expiration Tests")
    class OtpVerificationTests {

        @Test
        @DisplayName("Should verify OTP successfully when session is active and valid code provided")
        void verifyOtpSuccess() throws Exception {
            User user = createTestUser("otpuser@example.com", "Password123", false);
            createTestOtp(user, "654321", "verify", false);

            MockHttpSession session = new MockHttpSession();
            session.setAttribute("userId", user.getId().toString());
            session.setAttribute("role", user.getRole().getName());
            session.setAttribute("email", user.getEmail());

            VerifyOtpRequest req = new VerifyOtpRequest("654321");

            mockMvc.perform(post("/api/auth/verify-otp")
                            .session(session)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Email verified successfully"))
                    .andExpect(jsonPath("$.data.isVerified").value(true))
                    .andExpect(jsonPath("$.data.email").value("otpuser@example.com"));

            User refreshed = userRepository.findById(user.getId()).orElseThrow();
            assertTrue(refreshed.isVerified());
        }

        @Test
        @DisplayName("Should verify OTP using email in request without active session")
        void verifyOtpWithEmailSuccess() throws Exception {
            User user = createTestUser("emailotp@example.com", "Password123", false);
            createTestOtp(user, "555666", "verify", false);

            VerifyOtpRequest req = new VerifyOtpRequest("emailotp@example.com", "555666");

            mockMvc.perform(post("/api/auth/verify-otp")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Email verified successfully"))
                    .andExpect(jsonPath("$.data.isVerified").value(true))
                    .andExpect(jsonPath("$.data.email").value("emailotp@example.com"));

            User refreshed = userRepository.findById(user.getId()).orElseThrow();
            assertTrue(refreshed.isVerified());
        }

        @Test
        @DisplayName("Should reject OTP verification when session has expired with 401 SESSION_EXPIRED")
        void verifyOtpExpiredSession() throws Exception {
            // No session provided or expired session
            VerifyOtpRequest req = new VerifyOtpRequest("654321");

            mockMvc.perform(post("/api/auth/verify-otp")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("SESSION_EXPIRED"))
                    .andExpect(jsonPath("$.message").value("Session expired. Please register again."));
        }

        @Test
        @DisplayName("Should reject OTP verification when code is invalid or expired with 400 INVALID_OTP")
        void verifyOtpInvalidOrExpiredCode() throws Exception {
            User user = createTestUser("expiredotp@example.com", "Password123", false);
            // Expired OTP
            createTestOtp(user, "111222", "verify", true);

            MockHttpSession session = new MockHttpSession();
            session.setAttribute("userId", user.getId().toString());

            VerifyOtpRequest req = new VerifyOtpRequest("111222");

            mockMvc.perform(post("/api/auth/verify-otp")
                            .session(session)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("INVALID_OTP"))
                    .andExpect(jsonPath("$.message").value("Invalid or expired verification code"));
        }

        @Test
        @DisplayName("Should verify OTP via email fallback route successfully")
        void verifyOtpByEmailSuccess() throws Exception {
            User user = createTestUser("fallback@example.com", "Password123", false);
            createTestOtp(user, "333444", "verify", false);

            VerifyOtpByEmailRequest req = new VerifyOtpByEmailRequest("fallback@example.com", "333444");

            mockMvc.perform(post("/api/auth/verify-otp-email")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.isVerified").value(true));
        }
    }

    @Nested
    @DisplayName("Password Reset & Lifecycle Tests")
    class PasswordResetTests {

        @Test
        @DisplayName("Should complete forgot-password and reset-password flow")
        void forgotAndResetPasswordSuccess() throws Exception {
            User user = createTestUser("resetme@example.com", "OldPassword123", true);

            ForgotPasswordRequest forgotReq = new ForgotPasswordRequest("resetme@example.com");
            mockMvc.perform(post("/api/auth/forgot-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(forgotReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));

            // Find the reset OTP generated by forgotPassword
            OtpToken resetToken = otpTokenRepository.findAll().stream()
                    .filter(t -> t.getUser().getId().equals(user.getId()) && "reset".equals(t.getPurpose()) && !t.isUsed())
                    .findFirst()
                    .orElseThrow();

            ResetPasswordRequest resetReq = new ResetPasswordRequest(
                    "resetme@example.com", resetToken.getOtpCode(), "NewPassword999", "NewPassword999"
            );

            mockMvc.perform(post("/api/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(resetReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Password reset successfully. Please log in."));

            User updated = userRepository.findByEmailIgnoreCase("resetme@example.com").orElseThrow();
            assertTrue(passwordEncoder.matches("NewPassword999", updated.getPasswordHash()));
        }

        @Test
        @DisplayName("Should reject reset password if passwords do not match")
        void resetPasswordMismatch() throws Exception {
            ResetPasswordRequest resetReq = new ResetPasswordRequest(
                    "resetme@example.com", "123456", "NewPassword1", "DifferentPassword2"
            );

            mockMvc.perform(post("/api/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(resetReq)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Passwords do not match"));
        }
    }

    @Nested
    @DisplayName("Profile & Password Change Tests")
    class ProfileTests {

        @Test
        @DisplayName("Should retrieve and update user profile when authenticated")
        void getAndUpdateProfile() throws Exception {
            User user = createTestUser("profileuser@example.com", "Password123", true);

            // Log in first to acquire valid session
            LoginRequest loginReq = new LoginRequest("profileuser@example.com", "Password123");
            MvcResult loginRes = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq)))
                    .andExpect(status().isOk())
                    .andReturn();

            MockHttpSession session = (MockHttpSession) loginRes.getRequest().getSession(false);
            assertNotNull(session);

            // GET /api/auth/me
            mockMvc.perform(get("/api/auth/me").session(session))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.email").value("profileuser@example.com"))
                    .andExpect(jsonPath("$.data.name").value("Test User"));

            // PUT /api/auth/me
            UpdateProfileRequest updateReq = new UpdateProfileRequest("Updated Name", "9123456789");
            mockMvc.perform(put("/api/auth/me")
                            .session(session)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(updateReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Profile updated successfully"))
                    .andExpect(jsonPath("$.data.name").value("Updated Name"))
                    .andExpect(jsonPath("$.data.phone").value("9123456789"));

            // POST /api/auth/change-password with correct password
            ChangePasswordRequest changeReq = new ChangePasswordRequest("Password123", "BrandNewPassword456");
            mockMvc.perform(post("/api/auth/change-password")
                            .session(session)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(changeReq)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Password changed successfully"));

            User refreshed = userRepository.findById(user.getId()).orElseThrow();
            assertTrue(passwordEncoder.matches("BrandNewPassword456", refreshed.getPasswordHash()));

            // Logout
            mockMvc.perform(post("/api/auth/logout").session(session))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Logged out successfully"));

            // Calling /api/auth/me after logout should return 401 UNAUTHORISED
            mockMvc.perform(get("/api/auth/me").session(session))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("UNAUTHORISED"));
        }

        @Test
        @DisplayName("Should reject password change with incorrect current password")
        void changePasswordIncorrectCurrent() throws Exception {
            createTestUser("wrongpw@example.com", "InitialPassword123", true);

            LoginRequest loginReq = new LoginRequest("wrongpw@example.com", "InitialPassword123");
            MvcResult loginRes = mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(loginReq)))
                    .andExpect(status().isOk())
                    .andReturn();

            MockHttpSession session = (MockHttpSession) loginRes.getRequest().getSession(false);

            ChangePasswordRequest changeReq = new ChangePasswordRequest("WrongInitial123", "NewSecretPassword456");
            mockMvc.perform(post("/api/auth/change-password")
                            .session(session)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(changeReq)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.message").value("Current password is incorrect"));
        }
    }
}
