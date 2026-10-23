package com.slotplay.database;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PostgreSqlSafeguardsTest {

    @Test
    @DisplayName("Safeguards: Correctly extracts database name from JDBC and cloud URLs")
    void testExtractDatabaseName() {
        assertEquals("slotplay_test", PostgreSqlMigrationTest.extractDatabaseName("jdbc:postgresql://localhost:5432/slotplay_test"));
        assertEquals("slotplay_test", PostgreSqlMigrationTest.extractDatabaseName("jdbc:postgresql://ep-silent.eu-west-1.aws.neon.tech/slotplay_test?sslmode=require"));
        assertEquals("test_db", PostgreSqlMigrationTest.extractDatabaseName("postgres://user:pass@host:5432/test_db"));
        assertEquals("slotplay", PostgreSqlMigrationTest.extractDatabaseName("postgres://user:pass@host:5432/slotplay?sslmode=require"));
        assertNull(PostgreSqlMigrationTest.extractDatabaseName(""));
        assertNull(PostgreSqlMigrationTest.extractDatabaseName(null));
    }

    @Test
    @DisplayName("Safeguards: Accepts valid isolated test databases")
    void testAcceptsValidTestDatabases() {
        assertDoesNotThrow(() ->
                PostgreSqlMigrationTest.validateTargetDatabase(
                        "jdbc:postgresql://localhost:5432/slotplay_test?sslmode=disable",
                        "jdbc:postgresql://live-host:5432/slotplay"
                )
        );

        assertDoesNotThrow(() ->
                PostgreSqlMigrationTest.validateTargetDatabase(
                        "postgres://user:pass@ep-isolated.aws.neon.tech/slotplay_test?sslmode=require",
                        null
                )
        );

        assertDoesNotThrow(() ->
                PostgreSqlMigrationTest.validateTargetDatabase(
                        "postgresql://neondb_owner:pass@ep-round-meadow.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require",
                        null
                )
        );
    }

    @Test
    @DisplayName("Safeguards: Fails closed when database name does not contain test suffix/prefix")
    void testFailsClosedOnNonTestDatabaseName() {
        var ex = assertThrows(SecurityException.class, () ->
                PostgreSqlMigrationTest.validateTargetDatabase(
                        "jdbc:postgresql://localhost:5432/slotplay",
                        null
                )
        );
        assertTrue(ex.getMessage().contains("is not established as an isolated test database"));

        var ex2 = assertThrows(SecurityException.class, () ->
                PostgreSqlMigrationTest.validateTargetDatabase(
                        "postgres://user:pass@host:5432/postgres",
                        null
                )
        );
        assertTrue(ex2.getMessage().contains("is not established as an isolated test database"));
    }

    @Test
    @DisplayName("Safeguards: Rejects URLs containing production keywords")
    void testRejectsProductionKeywords() {
        var ex = assertThrows(SecurityException.class, () ->
                PostgreSqlMigrationTest.validateTargetDatabase(
                        "jdbc:postgresql://production-cluster.internal:5432/slotplay_test",
                        null
                )
        );
        assertTrue(ex.getMessage().contains("contains production/live keywords"));
    }

    @Test
    @DisplayName("Safeguards: Rejects TEST_POSTGRES_URL when it matches DATABASE_URL")
    void testRejectsCollisionWithApplicationDatabase() {
        String sameUrl = "jdbc:postgresql://localhost:5432/slotplay_test";
        var ex = assertThrows(SecurityException.class, () ->
                PostgreSqlMigrationTest.validateTargetDatabase(sameUrl, sameUrl)
        );
        assertTrue(ex.getMessage().contains("matches DATABASE_URL"));
    }
}
