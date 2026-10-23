package com.slotplay.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DatabaseUrlParserTest {

    @Test
    @DisplayName("Parse cloud postgres:// URI with credentials, port, and query params")
    void testParseCloudPostgresUri() {
        String raw = "postgres://neon_user:super_secret_pwd@ep-winter-water.us-east-2.aws.neon.tech:5432/neondb?sslmode=require";
        var parsed = DatabaseUrlParser.parse(raw, null, null);

        assertEquals("jdbc:postgresql://ep-winter-water.us-east-2.aws.neon.tech:5432/neondb?sslmode=require", parsed.jdbcUrl());
        assertEquals("neon_user", parsed.username());
        assertEquals("super_secret_pwd", parsed.password());

        // Ensure toString masks the password
        assertFalse(parsed.toString().contains("super_secret_pwd"));
        assertTrue(parsed.toString().contains("password=***"));
    }

    @Test
    @DisplayName("Parse postgresql:// URI without query params automatically adds sslmode=require for non-localhost")
    void testParsePostgresqlUriAddsSslForRemoteHost() {
        String raw = "postgresql://railway_user:p4ssw0rd@monorail.proxy.rlwy.net:12345/railway";
        var parsed = DatabaseUrlParser.parse(raw, null, null);

        assertEquals("jdbc:postgresql://monorail.proxy.rlwy.net:12345/railway?sslmode=require", parsed.jdbcUrl());
        assertEquals("railway_user", parsed.username());
        assertEquals("p4ssw0rd", parsed.password());
    }

    @Test
    @DisplayName("Parse standard jdbc:postgresql:// URL preserves URL and uses fallback credentials")
    void testParseJdbcUrlPassThrough() {
        String raw = "jdbc:postgresql://localhost:5432/slotplay";
        var parsed = DatabaseUrlParser.parse(raw, "local_user", "local_pass");

        assertEquals("jdbc:postgresql://localhost:5432/slotplay", parsed.jdbcUrl());
        assertEquals("local_user", parsed.username());
        assertEquals("local_pass", parsed.password());
    }

    @Test
    @DisplayName("Invalid or empty URLs fail fast with clear sanitized message")
    void testInvalidUrlsFailFast() {
        var ex1 = assertThrows(IllegalArgumentException.class, () -> DatabaseUrlParser.parse("", "u", "p"));
        assertTrue(ex1.getMessage().contains("must not be null or empty"));

        var ex2 = assertThrows(IllegalArgumentException.class, () -> DatabaseUrlParser.parse("mysql://user:pass@host/db", "u", "p"));
        assertTrue(ex2.getMessage().contains("Unsupported database URL scheme"));

        var ex3 = assertThrows(IllegalArgumentException.class, () -> DatabaseUrlParser.parse("postgres://user:pass@/dbname", "u", "p"));
        assertTrue(ex3.getMessage().contains("missing host"));
    }

    @Test
    @DisplayName("Parse quoted Neon PostgreSQL URL and preserve complex query parameters")
    void testParseQuotedNeonUri() {
        String raw = "\"postgresql://neondb_owner:npg_secret123@ep-round-meadow.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require\"";
        var parsed = DatabaseUrlParser.parse(raw, null, null);

        assertEquals("jdbc:postgresql://ep-round-meadow.us-east-1.aws.neon.tech:5432/neondb?sslmode=require&channel_binding=require", parsed.jdbcUrl());
        assertEquals("neondb_owner", parsed.username());
        assertEquals("npg_secret123", parsed.password());
    }

    @Test
    @DisplayName("Parse JDBC URL with embedded user/password credentials and normalize to standard JDBC URL")
    void testParseJdbcUrlWithEmbeddedCredentials() {
        String raw = "jdbc:postgresql://neon_admin:neon_pwd@ep-fast-host.neon.tech:5432/neondb?sslmode=require";
        var parsed = DatabaseUrlParser.parse(raw, null, null);

        assertEquals("jdbc:postgresql://ep-fast-host.neon.tech:5432/neondb?sslmode=require", parsed.jdbcUrl());
        assertEquals("neon_admin", parsed.username());
        assertEquals("neon_pwd", parsed.password());
    }

    @Test
    @DisplayName("maskJdbcUrl masks user and password parameters in logs")
    void testMaskJdbcUrl() {
        String url = "jdbc:postgresql://host:5432/db?user=myuser&password=secretpassword&sslmode=require";
        String masked = DatabaseUrlParser.maskJdbcUrl(url);

        assertFalse(masked.contains("secretpassword"));
        assertFalse(masked.contains("myuser"));
        assertTrue(masked.contains("password=***"));
        assertTrue(masked.contains("user=***"));
    }
}

