package com.slotplay.service;

import com.slotplay.dto.LoginRequest;
import com.slotplay.dto.RegisterRequest;
import com.slotplay.dto.RegisterResponse;
import com.slotplay.entity.Role;
import com.slotplay.entity.User;
import com.slotplay.exception.AppException;
import com.slotplay.repository.OtpTokenRepository;
import com.slotplay.repository.RoleRepository;
import com.slotplay.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AuthServiceTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private OtpTokenRepository otpTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        if (roleRepository.findByName("user").isEmpty()) {
            roleRepository.save(new Role("user"));
        }
    }

    @Test
    @DisplayName("Password hashing must use BCrypt with strength 12")
    void testPasswordHashingStrength() {
        RegisterRequest req = new RegisterRequest("Hashing Test", "hash@example.com", "SecurePassword123", null);
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        RegisterResponse res = authService.register(req, request, response);
        assertNotNull(res);

        User user = userRepository.findByEmailIgnoreCase("hash@example.com").orElseThrow();
        String hash = user.getPasswordHash();

        // BCrypt hash starts with $2a$ or $2b$ and cost factor 12 ($2a$12$ or $2b$12$)
        assertTrue(hash.startsWith("$2a$12$") || hash.startsWith("$2b$12$"), "Hash must use BCrypt with 12 rounds");
        assertTrue(passwordEncoder.matches("SecurePassword123", hash));
        assertFalse(passwordEncoder.matches("WrongPassword123", hash));
    }

    @Test
    @DisplayName("Invalid credentials must throw AppException with INVALID_CREDENTIALS code")
    void testInvalidCredentialsCode() {
        LoginRequest req = new LoginRequest("nonexistent@example.com", "Password123");
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();

        AppException ex = assertThrows(AppException.class, () -> authService.login(req, request, response));
        assertEquals("INVALID_CREDENTIALS", ex.getCode());
        assertEquals("Invalid email or password", ex.getMessage());
    }

    @Test
    @DisplayName("Duplicate email registration must throw AppException with CONFLICT code")
    void testDuplicateEmailCode() {
        RegisterRequest req1 = new RegisterRequest("First User", "first@example.com", "Password123", null);
        authService.register(req1, new MockHttpServletRequest(), new MockHttpServletResponse());

        RegisterRequest req2 = new RegisterRequest("Second User", "first@example.com", "Password123", null);
        AppException ex = assertThrows(AppException.class, () -> authService.register(req2, new MockHttpServletRequest(), new MockHttpServletResponse()));
        assertEquals("CONFLICT", ex.getCode());
        assertEquals("An account with this email already exists", ex.getMessage());
    }
}
