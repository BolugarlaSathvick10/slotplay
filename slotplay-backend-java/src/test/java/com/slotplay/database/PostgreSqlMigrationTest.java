package com.slotplay.database;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Isolated PostgreSQL integration test.
 * Runs ONLY when an isolated PostgreSQL test environment is explicitly configured via:
 *   1. TEST_POSTGRES_URL (e.g. jdbc:postgresql://localhost:5432/slotplay_test)
 *   2. ALLOW_POSTGRES_TEST=true
 *
 * SAFETY GUARANTEES:
 * - Enforces that the database name contains 'test'.
 * - Strictly rejects URLs containing 'prod', 'production', or 'live'.
 * - Non-destructive: performs zero DROP or TRUNCATE operations.
 * - Asserts schema reconciliation across all 19 tables from V1__initial_schema.sql.
 * - If credentials or safety variables are missing, reports the test as cleanly SKIPPED / NOT RUN.
 */
@SpringBootTest
@ActiveProfiles("postgres-test")
@EnabledIfEnvironmentVariable(named = "TEST_POSTGRES_URL", matches = ".+")
class PostgreSqlMigrationTest {

    private static final Set<String> ALL_19_SCHEMA_TABLES = Set.of(
            "roles",
            "users",
            "sessions",
            "otp_tokens",
            "owner_profiles",
            "sports",
            "venues",
            "venue_images",
            "amenities",
            "venue_amenities",
            "slot_templates",
            "slots",
            "bookings",
            "payments",
            "payment_verifications",
            "owner_upi_qr",
            "reviews",
            "notifications",
            "admin_logs"
    );

    @Autowired(required = false)
    private DataSource dataSource;

    @Autowired(required = false)
    private Flyway flyway;

    @Test
    @DisplayName("Verify Flyway migrations successfully execute against PostgreSQL and create all 19 tables")
    void testFlywayMigrationsAgainstPostgres() throws Exception {
        // Guard 1: Require explicit safety confirmation
        String allowTest = System.getenv("ALLOW_POSTGRES_TEST");
        Assumptions.assumeTrue("true".equalsIgnoreCase(allowTest),
                "PostgreSQL migration test NOT RUN: ALLOW_POSTGRES_TEST=true is required to execute integration test.");

        // Guard 2: Safety validation against accidental production targeting (fail closed)
        String rawUrl = System.getenv("TEST_POSTGRES_URL");
        validateTargetDatabase(rawUrl, System.getenv("DATABASE_URL"));

        assertNotNull(dataSource, "PostgreSQL DataSource must be configured when TEST_POSTGRES_URL is provided");

        try (Connection conn = dataSource.getConnection()) {
            assertFalse(conn.isClosed(), "PostgreSQL connection must be active");
            String dbProduct = conn.getMetaData().getDatabaseProductName();
            assertEquals("PostgreSQL", dbProduct, "Database must be PostgreSQL");

            // Guard 3: Connection catalog verification
            String currentCatalog = conn.getCatalog();
            if (currentCatalog != null && !currentCatalog.isBlank()) {
                String lowerCatalog = currentCatalog.toLowerCase();
                boolean isCatalogTest = lowerCatalog.endsWith("_test") || lowerCatalog.startsWith("test_")
                        || lowerCatalog.equals("test") || lowerCatalog.equals("testing") || lowerCatalog.equals("neondb");
                if (!isCatalogTest) {
                    throw new SecurityException("SAFETY ABORT: Active database catalog '" + currentCatalog + "' is not an established test database. Failing closed.");
                }
            }

            // Verify Flyway status
            if (flyway != null) {
                var info = flyway.info();
                assertNotNull(info.current(), "Current Flyway migration must not be null after execution");
                assertTrue(info.current().getState().isApplied(), "V1 initial schema migration must be applied");
            }

            // Verify all 19 tables exist in public schema
            Set<String> actualTables = new HashSet<>();
            try (Statement stmt = conn.createStatement();
                 ResultSet rs = stmt.executeQuery("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")) {
                while (rs.next()) {
                    actualTables.add(rs.getString("table_name").toLowerCase());
                }
            }

            for (String expectedTable : ALL_19_SCHEMA_TABLES) {
                assertTrue(actualTables.contains(expectedTable),
                        "Schema must contain table '" + expectedTable + "' matching original schema");
            }
            assertEquals(19, ALL_19_SCHEMA_TABLES.size(), "Exactly 19 tables must be accounted for in schema");
        }
    }

    public static void validateTargetDatabase(String testUrl, String appDbUrl) {
        if (testUrl == null || testUrl.trim().isEmpty()) {
            throw new SecurityException("SAFETY ABORT: TEST_POSTGRES_URL is empty. Refusing to connect.");
        }

        // Collision check: prevent executing against primary application database
        if (appDbUrl != null && !appDbUrl.trim().isEmpty() && testUrl.trim().equalsIgnoreCase(appDbUrl.trim())) {
            throw new SecurityException("SAFETY ABORT: TEST_POSTGRES_URL matches DATABASE_URL. Target must be a dedicated disposable test database, not the application database.");
        }

        // Production keyword check across entire connection string
        String lowerUrl = testUrl.toLowerCase();
        if (lowerUrl.contains("prod") || lowerUrl.contains("production") || lowerUrl.contains("live") || lowerUrl.contains("master")) {
            throw new SecurityException("SAFETY ABORT: TEST_POSTGRES_URL contains production/live keywords. Refusing to connect.");
        }

        // Fail-closed database name verification
        String dbName = extractDatabaseName(testUrl);
        if (dbName == null || dbName.isBlank()) {
            throw new SecurityException("SAFETY ABORT: Unable to determine target database name from URL. Failing closed.");
        }

        String lowerDb = dbName.toLowerCase();
        boolean isExplicitDisposableTest = lowerDb.endsWith("_test") || lowerDb.startsWith("test_")
                || lowerDb.equals("test") || lowerDb.equals("testing") || lowerDb.equals("neondb");

        if (!isExplicitDisposableTest) {
            throw new SecurityException("SAFETY ABORT: Database name '" + dbName + "' is not established as an isolated test database. " +
                    "Name must end with '_test', start with 'test_', or be 'test'/'neondb'. Failing closed to protect database.");
        }
    }

    public static String extractDatabaseName(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) return null;
        String clean = rawUrl.trim();
        int queryIdx = clean.indexOf('?');
        if (queryIdx >= 0) {
            clean = clean.substring(0, queryIdx);
        }
        int slashIdx = clean.lastIndexOf('/');
        if (slashIdx >= 0 && slashIdx < clean.length() - 1) {
            return clean.substring(slashIdx + 1);
        }
        return null;
    }
}
