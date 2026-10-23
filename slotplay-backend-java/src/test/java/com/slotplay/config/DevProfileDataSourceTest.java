package com.slotplay.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests verifying that the 'dev' profile and DataSourceConfig select the configured
 * database URL (such as Neon PostgreSQL) rather than silently falling back to localhost.
 */
class DevProfileDataSourceTest {

    @Test
    @DisplayName("Dev profile selects configured remote Neon DATABASE_URL without falling back to localhost")
    void testDevProfileSelectsRemoteNeonDatabaseUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        env.setProperty("DATABASE_URL", "postgresql://neondb_owner:npg_test_secret@ep-noisy-sunset.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

        DataSourceConfig config = new DataSourceConfig(env);
        DatabaseUrlParser.ParsedDatabaseConfig parsed = config.resolveConfig();

        assertNotNull(parsed);
        assertEquals("jdbc:postgresql://ep-noisy-sunset.c-3.us-east-1.aws.neon.tech:5432/neondb?sslmode=require&channel_binding=require", parsed.jdbcUrl());
        assertEquals("neondb_owner", parsed.username());
        assertEquals("npg_test_secret", parsed.password());

        // Crucial: Must NOT fall back to localhost
        assertFalse(DataSourceConfig.isLocalhost(parsed.jdbcUrl()), "Must not fall back to localhost when remote DATABASE_URL is configured");
        assertFalse(parsed.jdbcUrl().contains("localhost:5432"));
        assertFalse(parsed.jdbcUrl().contains("127.0.0.1"));
    }

    @Test
    @DisplayName("Dev profile selects standard JDBC remote URL without falling back to localhost")
    void testDevProfileSelectsRemoteJdbcUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        env.setProperty("DATABASE_URL", "jdbc:postgresql://ep-remote-host.neon.tech:5432/slotplay?sslmode=require");
        env.setProperty("DATABASE_USERNAME", "custom_user");
        env.setProperty("DATABASE_PASSWORD", "custom_pass");

        DataSourceConfig config = new DataSourceConfig(env);
        DatabaseUrlParser.ParsedDatabaseConfig parsed = config.resolveConfig();

        assertEquals("jdbc:postgresql://ep-remote-host.neon.tech:5432/slotplay?sslmode=require", parsed.jdbcUrl());
        assertEquals("custom_user", parsed.username());
        assertEquals("custom_pass", parsed.password());
        assertFalse(DataSourceConfig.isLocalhost(parsed.jdbcUrl()));
    }

    @Test
    @DisplayName("Dev profile selects SPRING_DATASOURCE_URL when DATABASE_URL is not set")
    void testDevProfileSelectsSpringDatasourceUrl() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        env.setProperty("spring.datasource.url", "postgresql://cloud_user:cloud_pwd@ep-cloud-db.neon.tech/slotplay?sslmode=require");

        DataSourceConfig config = new DataSourceConfig(env);
        DatabaseUrlParser.ParsedDatabaseConfig parsed = config.resolveConfig();

        assertEquals("jdbc:postgresql://ep-cloud-db.neon.tech:5432/slotplay?sslmode=require", parsed.jdbcUrl());
        assertEquals("cloud_user", parsed.username());
        assertEquals("cloud_pwd", parsed.password());
        assertFalse(DataSourceConfig.isLocalhost(parsed.jdbcUrl()));
    }

    @Test
    @DisplayName("Dev profile defaults to localhost when no remote URL is configured and flags as localhost")
    void testDevProfileDefaultsToLocalhostWhenUnconfigured() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        env.setProperty("slotplay.dotenv.enabled", "false");

        DataSourceConfig config = new DataSourceConfig(env);
        DatabaseUrlParser.ParsedDatabaseConfig parsed = config.resolveConfig();

        assertEquals("jdbc:postgresql://localhost:5432/slotplay", parsed.jdbcUrl());
        assertEquals("postgres", parsed.username());
        assertEquals("postgres", parsed.password());
        assertTrue(DataSourceConfig.isLocalhost(parsed.jdbcUrl()));
    }

    @Test
    @DisplayName("Dev profile preserves separate DATABASE_USERNAME and DATABASE_PASSWORD environment variables")
    void testDevProfilePreservesSeparateCredentials() {
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");
        env.setProperty("DATABASE_URL", "postgresql://ep-standalone.neon.tech/neondb?sslmode=require");
        env.setProperty("DATABASE_USERNAME", "neon_dedicated_user");
        env.setProperty("DATABASE_PASSWORD", "neon_dedicated_pass");

        DataSourceConfig config = new DataSourceConfig(env);
        DatabaseUrlParser.ParsedDatabaseConfig parsed = config.resolveConfig();

        assertEquals("jdbc:postgresql://ep-standalone.neon.tech:5432/neondb?sslmode=require", parsed.jdbcUrl());
        assertEquals("neon_dedicated_user", parsed.username());
        assertEquals("neon_dedicated_pass", parsed.password());
    }
}
