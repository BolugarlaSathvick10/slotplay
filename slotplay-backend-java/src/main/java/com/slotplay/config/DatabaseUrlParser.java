package com.slotplay.config;

import java.net.URI;
import java.net.URISyntaxException;

/**
 * Utility to parse and normalize database connection URLs across hosting providers.
 *
 * Supports:
 * - Cloud provider URLs: postgres://user:password@host:port/database?sslmode=require
 * - PostgreSQL URLs:    postgresql://user:password@host:port/database
 * - Standard JDBC URLs: jdbc:postgresql://host:port/database
 *
 * Guarantees that credentials are never exposed in logs or exception messages.
 */
public class DatabaseUrlParser {

    public record ParsedDatabaseConfig(String jdbcUrl, String username, String password) {
        @Override
        public String toString() {
            return "ParsedDatabaseConfig[jdbcUrl=" + maskJdbcUrl(jdbcUrl) + ", username=" + (username != null ? username : "none") + ", password=***]";
        }
    }

    /**
     * Parses a raw database URL and optional fallback credentials into a normalized JDBC configuration.
     *
     * @param rawUrl           raw URL from environment or properties (can be postgres://, postgresql://, or jdbc:...)
     * @param fallbackUsername username from configuration if not embedded in URL
     * @param fallbackPassword password from configuration if not embedded in URL
     * @return normalized ParsedDatabaseConfig
     */
    public static ParsedDatabaseConfig parse(String rawUrl, String fallbackUsername, String fallbackPassword) {
        if (rawUrl == null || rawUrl.trim().isEmpty()) {
            throw new IllegalArgumentException("Database URL must not be null or empty");
        }

        String trimmed = rawUrl.trim();
        if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
            trimmed = trimmed.substring(1, trimmed.length() - 1).trim();
        }

        // Case 1: Standard JDBC URL with embedded credentials (jdbc:postgresql://user:pass@host...)
        if (trimmed.startsWith("jdbc:postgresql://") && trimmed.contains("@")) {
            return parseCloudUri(trimmed.substring(5), fallbackUsername, fallbackPassword);
        }

        // Case 2: Standard JDBC URL without embedded credentials
        if (trimmed.startsWith("jdbc:postgresql://") || trimmed.startsWith("jdbc:h2:")) {
            return new ParsedDatabaseConfig(trimmed, fallbackUsername, fallbackPassword);
        }

        // Case 3: Cloud URI format (postgres:// or postgresql://)
        if (trimmed.startsWith("postgres://") || trimmed.startsWith("postgresql://")) {
            return parseCloudUri(trimmed, fallbackUsername, fallbackPassword);
        }

        // If unknown scheme
        if (!trimmed.startsWith("jdbc:")) {
            throw new IllegalArgumentException("Unsupported database URL scheme. Expected postgres://, postgresql://, or jdbc:postgresql://");
        }

        return new ParsedDatabaseConfig(trimmed, fallbackUsername, fallbackPassword);
    }

    private static ParsedDatabaseConfig parseCloudUri(String rawUri, String fallbackUser, String fallbackPass) {
        try {
            // Replace scheme prefix with a generic scheme for URI parsing if needed
            String cleanUri = rawUri.replaceFirst("^postgres://", "postgresql://");
            URI uri = new URI(cleanUri);

            String host = uri.getHost();
            if (host == null || host.trim().isEmpty()) {
                throw new IllegalArgumentException("Invalid database URL: missing host");
            }

            int port = uri.getPort();
            if (port == -1) {
                port = 5432;
            }

            String path = uri.getPath();
            if (path == null || path.length() <= 1) {
                throw new IllegalArgumentException("Invalid database URL: missing database name");
            }
            String database = path.startsWith("/") ? path.substring(1) : path;

            String username = fallbackUser;
            String password = fallbackPass;

            String userInfo = uri.getUserInfo();
            if (userInfo != null && !userInfo.isEmpty()) {
                String[] parts = userInfo.split(":", 2);
                username = parts[0];
                if (parts.length > 1) {
                    password = parts[1];
                }
            }

            StringBuilder jdbcUrl = new StringBuilder();
            jdbcUrl.append("jdbc:postgresql://").append(host).append(":").append(port).append("/").append(database);

            String query = uri.getQuery();
            if (query != null && !query.isEmpty()) {
                jdbcUrl.append("?").append(query);
            } else if (!"localhost".equalsIgnoreCase(host) && !"127.0.0.1".equals(host)) {
                // Ensure SSL is required for hosted cloud databases (Neon, Railway, etc.)
                jdbcUrl.append("?sslmode=require");
            }

            return new ParsedDatabaseConfig(jdbcUrl.toString(), username, password);
        } catch (URISyntaxException e) {
            throw new IllegalArgumentException("Invalid database URL format. Please verify the URL syntax without credentials in logs.");
        }
    }

    public static String maskJdbcUrl(String url) {
        if (url == null) return "null";
        // Mask any user/password parameters in query string
        return url.replaceAll("password=[^&;]+", "password=***")
                  .replaceAll("user=[^&;]+", "user=***");
    }
}
