package com.slotplay.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slotplay.dto.LoginRequest;
import com.slotplay.dto.UpdateUserRoleRequest;
import com.slotplay.dto.UpdateUserVerifyRequest;
import com.slotplay.entity.Role;
import com.slotplay.entity.User;
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

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class RoleBasedAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private Role playerRole;
    private Role ownerRole;
    private Role adminRole;

    private User playerUser;
    private User ownerUser;
    private User adminUser;

    @BeforeEach
    void setUp() {
        playerRole = roleRepository.findByName("user")
                .orElseGet(() -> roleRepository.save(new Role("user")));
        ownerRole = roleRepository.findByName("owner")
                .orElseGet(() -> roleRepository.save(new Role("owner")));
        adminRole = roleRepository.findByName("admin")
                .orElseGet(() -> roleRepository.save(new Role("admin")));

        playerUser = createUser("player@slotplay.in", "PlayerPass123", playerRole);
        ownerUser = createUser("owner@slotplay.in", "OwnerPass123", ownerRole);
        adminUser = createUser("admin@slotplay.in", "AdminPass123", adminRole);
    }

    private User createUser(String email, String rawPassword, Role role) {
        User user = new User();
        user.setName("Name of " + role.getName());
        user.setEmail(email.toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setRole(role);
        user.setVerified(true);
        return userRepository.save(user);
    }

    private MockHttpSession loginAndGetSession(String email, String password) throws Exception {
        LoginRequest req = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotNull(session, "Session should not be null after successful login");
        return session;
    }

    @Nested
    @DisplayName("Unauthorized Access Tests (No Session)")
    class UnauthorizedAccessTests {

        @Test
        @DisplayName("Unauthenticated access to /api/auth/me should return 401 UNAUTHORISED")
        void unauthenticatedMe() throws Exception {
            mockMvc.perform(get("/api/auth/me"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("UNAUTHORISED"))
                    .andExpect(jsonPath("$.message").value("Not authenticated"));
        }

        @Test
        @DisplayName("Unauthenticated access to /api/auth/logout should return 401 UNAUTHORISED")
        void unauthenticatedLogout() throws Exception {
            mockMvc.perform(post("/api/auth/logout"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("UNAUTHORISED"))
                    .andExpect(jsonPath("$.message").value("Not authenticated"));
        }

        @Test
        @DisplayName("Unauthenticated access to /api/admin/users should return 401 UNAUTHORISED")
        void unauthenticatedAdminUsers() throws Exception {
            mockMvc.perform(get("/api/admin/users"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("UNAUTHORISED"))
                    .andExpect(jsonPath("$.message").value("Not authenticated"));
        }

        @Test
        @DisplayName("Unauthenticated access to /api/owner/venues should return 401 UNAUTHORISED")
        void unauthenticatedOwnerVenues() throws Exception {
            mockMvc.perform(get("/api/owner/venues"))
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("UNAUTHORISED"))
                    .andExpect(jsonPath("$.message").value("Not authenticated"));
        }
    }

    @Nested
    @DisplayName("Player Permissions Tests (ROLE_USER / roleId 1)")
    class PlayerPermissionsTests {

        @Test
        @DisplayName("Player can access own profile /api/auth/me")
        void playerAccessMe() throws Exception {
            MockHttpSession session = loginAndGetSession("player@slotplay.in", "PlayerPass123");

            mockMvc.perform(get("/api/auth/me").session(session))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.email").value("player@slotplay.in"))
                    .andExpect(jsonPath("$.data.role").value("user"));
        }

        @Test
        @DisplayName("Player is forbidden from accessing /api/admin/users (403 FORBIDDEN)")
        void playerCannotAccessAdmin() throws Exception {
            MockHttpSession session = loginAndGetSession("player@slotplay.in", "PlayerPass123");

            mockMvc.perform(get("/api/admin/users").session(session))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.message").value("You do not have permission to perform this action"));
        }

        @Test
        @DisplayName("Player is forbidden from accessing /api/owner/venues (403 FORBIDDEN)")
        void playerCannotAccessOwner() throws Exception {
            MockHttpSession session = loginAndGetSession("player@slotplay.in", "PlayerPass123");

            mockMvc.perform(get("/api/owner/venues").session(session))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"))
                    .andExpect(jsonPath("$.message").value("You do not have permission to perform this action"));
        }
    }

    @Nested
    @DisplayName("Owner Permissions Tests (ROLE_OWNER / roleId 2)")
    class OwnerPermissionsTests {

        @Test
        @DisplayName("Owner can access /api/owner/venues and /api/auth/me")
        void ownerAccessVenuesAndMe() throws Exception {
            MockHttpSession session = loginAndGetSession("owner@slotplay.in", "OwnerPass123");

            mockMvc.perform(get("/api/auth/me").session(session))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.role").value("owner"));

            mockMvc.perform(get("/api/owner/venues").session(session))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }

        @Test
        @DisplayName("Owner is forbidden from accessing /api/admin/users (403 FORBIDDEN)")
        void ownerCannotAccessAdmin() throws Exception {
            MockHttpSession session = loginAndGetSession("owner@slotplay.in", "OwnerPass123");

            mockMvc.perform(get("/api/admin/users").session(session))
                    .andExpect(status().isForbidden())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        }
    }

    @Nested
    @DisplayName("Admin Permissions Tests (ROLE_ADMIN / roleId 3)")
    class AdminPermissionsTests {

        @Test
        @DisplayName("Admin can access /api/admin/users, search users, and paginate results")
        void adminAccessUsers() throws Exception {
            MockHttpSession session = loginAndGetSession("admin@slotplay.in", "AdminPass123");

            mockMvc.perform(get("/api/admin/users")
                            .session(session)
                            .param("page", "1")
                            .param("limit", "10")
                            .param("search", "player"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.data").isArray())
                    .andExpect(jsonPath("$.data.page").value(1))
                    .andExpect(jsonPath("$.data.limit").value(10))
                    .andExpect(jsonPath("$.data.total", greaterThanOrEqualTo(1)))
                    .andExpect(jsonPath("$.data.pages", greaterThanOrEqualTo(1)));
        }

        @Test
        @DisplayName("Admin can promote a player to owner via PATCH /api/admin/users/{id}/role")
        void adminUpdateRole() throws Exception {
            MockHttpSession session = loginAndGetSession("admin@slotplay.in", "AdminPass123");

            UpdateUserRoleRequest req = new UpdateUserRoleRequest(ownerRole.getId());

            mockMvc.perform(patch("/api/admin/users/" + playerUser.getId() + "/role")
                            .session(session)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("Role updated"))
                    .andExpect(jsonPath("$.data.id").value(playerUser.getId().toString()))
                    .andExpect(jsonPath("$.data.roleId").value(ownerRole.getId()));

            User refreshed = userRepository.findById(playerUser.getId()).orElseThrow();
            assertEquals("owner", refreshed.getRole().getName());
        }

        @Test
        @DisplayName("Admin can toggle user verification via PATCH /api/admin/users/{id}/verify")
        void adminUpdateVerification() throws Exception {
            MockHttpSession session = loginAndGetSession("admin@slotplay.in", "AdminPass123");

            UpdateUserVerifyRequest req = new UpdateUserVerifyRequest(false);

            mockMvc.perform(patch("/api/admin/users/" + playerUser.getId() + "/verify")
                            .session(session)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("User updated"))
                    .andExpect(jsonPath("$.data.isVerified").value(false));

            User refreshed = userRepository.findById(playerUser.getId()).orElseThrow();
            assertFalse(refreshed.isVerified());
        }

        @Test
        @DisplayName("Admin role update rejects invalid roleId with 400 Bad Request")
        void adminRejectInvalidRoleId() throws Exception {
            MockHttpSession session = loginAndGetSession("admin@slotplay.in", "AdminPass123");

            UpdateUserRoleRequest req = new UpdateUserRoleRequest(99);

            mockMvc.perform(patch("/api/admin/users/" + playerUser.getId() + "/role")
                            .session(session)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isUnprocessableEntity())
                    .andExpect(jsonPath("$.success").value(false));
        }

        @Test
        @DisplayName("Admin role update on non-existent user returns 404 Not Found")
        void adminNotFoundUser() throws Exception {
            MockHttpSession session = loginAndGetSession("admin@slotplay.in", "AdminPass123");

            UpdateUserRoleRequest req = new UpdateUserRoleRequest(playerRole.getId());

            mockMvc.perform(patch("/api/admin/users/" + UUID.randomUUID() + "/role")
                            .session(session)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(req)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.success").value(false))
                    .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        }

        @Test
        @DisplayName("Admin can also access /api/owner/venues")
        void adminCanAccessOwnerVenues() throws Exception {
            MockHttpSession session = loginAndGetSession("admin@slotplay.in", "AdminPass123");

            mockMvc.perform(get("/api/owner/venues").session(session))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true));
        }
    }
}
