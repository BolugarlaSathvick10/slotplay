package com.slotplay.controller;

import com.slotplay.entity.Notification;
import com.slotplay.entity.Role;
import com.slotplay.entity.User;
import com.slotplay.repository.NotificationRepository;
import com.slotplay.repository.RoleRepository;
import com.slotplay.repository.UserRepository;
import com.slotplay.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
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
class NotificationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User user1;
    private User user2;

    @BeforeEach
    void setUp() {
        Role role = roleRepository.findByName("user")
                .orElseGet(() -> roleRepository.save(new Role("user")));

        user1 = new User();
        user1.setName("User One");
        user1.setEmail("user1." + UUID.randomUUID() + "@slotplay.in");
        user1.setPasswordHash("hash");
        user1.setRole(role);
        user1.setVerified(true);
        user1 = userRepository.save(user1);

        user2 = new User();
        user2.setName("User Two");
        user2.setEmail("user2." + UUID.randomUUID() + "@slotplay.in");
        user2.setPasswordHash("hash");
        user2.setRole(role);
        user2.setVerified(true);
        user2 = userRepository.save(user2);
    }

    private MockHttpSession createAuthSession(User user) {
        MockHttpSession session = new MockHttpSession();
        UserPrincipal principal = UserPrincipal.create(user);
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        session.setAttribute("SPRING_SECURITY_CONTEXT", context);
        return session;
    }

    @Test
    @DisplayName("User lists notifications with pagination and type filtering")
    void testListNotificationsAndFiltering() throws Exception {
        notificationRepository.save(new Notification(user1, "booking_confirmed", "Confirmed!", "Your booking is confirmed"));
        notificationRepository.save(new Notification(user1, "payment_rejected", "Rejected", "Your payment failed"));
        notificationRepository.save(new Notification(user2, "general", "Hello", "Welcome user 2"));

        // All for user1
        mockMvc.perform(get("/api/notifications")
                        .session(createAuthSession(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.data", hasSize(2)))
                .andExpect(jsonPath("$.data.total").value(2));

        // Filter by type
        mockMvc.perform(get("/api/notifications")
                        .param("type", "booking_confirmed")
                        .session(createAuthSession(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data", hasSize(1)))
                .andExpect(jsonPath("$.data.data[0].type").value("booking_confirmed"));
    }

    @Test
    @DisplayName("User marks single notification as read")
    void testMarkSingleAsRead() throws Exception {
        Notification n = notificationRepository.save(new Notification(user1, "booking_confirmed", "Confirmed", "Detail"));
        assertFalse(n.isRead());

        mockMvc.perform(patch("/api/notifications/" + n.getId() + "/read")
                        .session(createAuthSession(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("Notification marked as read"));

        Notification updated = notificationRepository.findById(n.getId()).orElseThrow();
        assertTrue(updated.isRead());
    }

    @Test
    @DisplayName("User marks all notifications as read")
    void testMarkAllAsRead() throws Exception {
        notificationRepository.save(new Notification(user1, "type1", "Title 1", "Body 1"));
        notificationRepository.save(new Notification(user1, "type2", "Title 2", "Body 2"));

        mockMvc.perform(post("/api/notifications/read-all")
                        .session(createAuthSession(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("All notifications marked as read"));

        var notifs = notificationRepository.findByUserIdOrderByCreatedAtDesc(user1.getId(), null);
        assertTrue(notifs.getContent().stream().allMatch(Notification::isRead));
    }

    @Test
    @DisplayName("User deletes their notification, but cannot delete another user's notification")
    void testDeleteNotificationPermissions() throws Exception {
        Notification n1 = notificationRepository.save(new Notification(user1, "type1", "Title 1", "Body 1"));
        Notification n2 = notificationRepository.save(new Notification(user2, "type2", "Title 2", "Body 2"));

        // User1 deleting User2's notification returns 404
        mockMvc.perform(delete("/api/notifications/" + n2.getId())
                        .session(createAuthSession(user1)))
                .andExpect(status().isNotFound());

        // User1 deleting their own notification succeeds
        mockMvc.perform(delete("/api/notifications/" + n1.getId())
                        .session(createAuthSession(user1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Notification deleted"));

        assertFalse(notificationRepository.existsById(n1.getId()));
        assertTrue(notificationRepository.existsById(n2.getId()));
    }
}
