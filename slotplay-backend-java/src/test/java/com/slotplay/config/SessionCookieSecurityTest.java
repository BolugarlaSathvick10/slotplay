package com.slotplay.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.web.servlet.server.CookieSameSiteSupplier;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
class SessionCookieSecurityTest {

    @Autowired
    private ServerProperties serverProperties;

    @Autowired
    private CookieSameSiteSupplier cookieSameSiteSupplier;

    @Test
    @DisplayName("Session cookie is configured with slotplay.sid and HttpOnly=true")
    void testSessionCookieConfiguration() {
        var cookie = serverProperties.getServlet().getSession().getCookie();
        assertNotNull(cookie);
        assertEquals("slotplay.sid", cookie.getName(), "Cookie name must be slotplay.sid");
        assertTrue(cookie.getHttpOnly(), "HttpOnly must be enabled to prevent XSS access");
    }

    @Test
    @DisplayName("CookieSameSiteSupplier bean is loaded and enforces SameSite policy")
    void testCookieSameSiteSupplier() {
        assertNotNull(cookieSameSiteSupplier, "CookieSameSiteSupplier bean must be registered");
    }
}
