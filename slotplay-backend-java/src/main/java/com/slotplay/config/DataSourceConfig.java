package com.slotplay.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.util.Arrays;

/**
 * Custom DataSource configuration active outside of the 'test' profile.
 * Normalizes cloud provider DATABASE_URL (postgres:// and postgresql://) to JDBC format,
 * sanitizes logging, and preserves SSL requirements.
 */
@Configuration
@Profile("!test")
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    private static final String DEFAULT_LOCAL_URL = "jdbc:postgresql://localhost:5432/slotplay";

    @Value("${spring.datasource.url:${DATABASE_URL:jdbc:postgresql://localhost:5432/slotplay}}")
    private String rawUrl;

    @Value("${spring.datasource.username:${DATABASE_USERNAME:postgres}}")
    private String defaultUsername = "postgres";

    @Value("${spring.datasource.password:${DATABASE_PASSWORD:postgres}}")
    private String defaultPassword = "postgres";

    private final Environment environment;

    public DataSourceConfig(Environment environment) {
        this.environment = environment;
    }

    /**
     * Resolves the effective parsed database configuration with priority:
     * 1. DATABASE_URL from environment / system properties
     * 2. .env file in current or parent directory
     * 3. spring.datasource.url property if non-localhost
     * 4. Injected rawUrl
     * 5. Localhost default
     */
    public DatabaseUrlParser.ParsedDatabaseConfig resolveConfig() {
        String effectiveUrl = resolveUrl();
        String effectiveUser = resolveUsername();
        String effectivePass = resolvePassword();
        return DatabaseUrlParser.parse(effectiveUrl, effectiveUser, effectivePass);
    }

    public String resolveUrl() {
        // Priority 1: Direct DATABASE_URL from environment variable or system property
        String envDbUrl = environment.getProperty("DATABASE_URL");
        if (envDbUrl != null && !envDbUrl.isBlank()) {
            return envDbUrl.trim();
        }

        // Priority 2: spring.datasource.url if explicitly provided and not default localhost
        String dsUrl = environment.getProperty("spring.datasource.url");
        if (dsUrl != null && !dsUrl.isBlank() && !isLocalhost(dsUrl)) {
            return dsUrl.trim();
        }

        // Priority 3: Local .env file if present and enabled
        if (!"false".equalsIgnoreCase(environment.getProperty("slotplay.dotenv.enabled"))) {
            String dotEnvUrl = readDotEnvProperty("DATABASE_URL");
            if (dotEnvUrl != null && !dotEnvUrl.isBlank()) {
                return dotEnvUrl.trim();
            }
        }

        // Priority 4: Injected rawUrl
        if (rawUrl != null && !rawUrl.isBlank()) {
            return rawUrl.trim();
        }

        return DEFAULT_LOCAL_URL;
    }

    public String resolveUsername() {
        String user = environment.getProperty("DATABASE_USERNAME");
        if (user != null && !user.isBlank()) {
            return user.trim();
        }
        String dsUser = environment.getProperty("spring.datasource.username");
        if (dsUser != null && !dsUser.isBlank() && !"postgres".equals(dsUser)) {
            return dsUser.trim();
        }
        if (!"false".equalsIgnoreCase(environment.getProperty("slotplay.dotenv.enabled"))) {
            String dotEnvUser = readDotEnvProperty("DATABASE_USERNAME");
            if (dotEnvUser != null && !dotEnvUser.isBlank()) {
                return dotEnvUser.trim();
            }
        }
        if (dsUser != null && !dsUser.isBlank()) {
            return dsUser.trim();
        }
        return defaultUsername;
    }

    public String resolvePassword() {
        String pass = environment.getProperty("DATABASE_PASSWORD");
        if (pass != null && !pass.isBlank()) {
            return pass.trim();
        }
        String dsPass = environment.getProperty("spring.datasource.password");
        if (dsPass != null && !dsPass.isBlank() && !"postgres".equals(dsPass)) {
            return dsPass.trim();
        }
        if (!"false".equalsIgnoreCase(environment.getProperty("slotplay.dotenv.enabled"))) {
            String dotEnvPass = readDotEnvProperty("DATABASE_PASSWORD");
            if (dotEnvPass != null && !dotEnvPass.isBlank()) {
                return dotEnvPass.trim();
            }
        }
        if (dsPass != null && !dsPass.isBlank()) {
            return dsPass.trim();
        }
        return defaultPassword;
    }

    public static boolean isLocalhost(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();
        return lower.contains("localhost") || lower.contains("127.0.0.1");
    }

    public static String readDotEnvProperty(String key) {
        try {
            java.nio.file.Path[] candidates = new java.nio.file.Path[] {
                java.nio.file.Path.of(".env"),
                java.nio.file.Path.of("slotplay-backend-java", ".env"),
                java.nio.file.Path.of("..", ".env"),
                java.nio.file.Path.of("..", "slotplay-backend-java", ".env")
            };
            java.nio.file.Path dotEnv = null;
            for (java.nio.file.Path candidate : candidates) {
                if (java.nio.file.Files.isRegularFile(candidate)) {
                    dotEnv = candidate;
                    break;
                }
            }
            if (dotEnv == null) {
                return null;
            }
            java.util.List<String> lines = java.nio.file.Files.readAllLines(dotEnv);
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.startsWith("#") || trimmed.isEmpty()) continue;
                int eqIdx = trimmed.indexOf('=');
                if (eqIdx > 0) {
                    String propKey = trimmed.substring(0, eqIdx).trim();
                    if (propKey.equals(key)) {
                        String val = trimmed.substring(eqIdx + 1).trim();
                        if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                            val = val.substring(1, val.length() - 1);
                        }
                        return val;
                    }
                }
            }
        } catch (Exception ignored) {
            // Silently fall through if file cannot be read
        }
        return null;
    }

    @Bean
    @Primary
    public DataSource dataSource() {
        DatabaseUrlParser.ParsedDatabaseConfig parsed = resolveConfig();

        boolean isProd = Arrays.asList(environment.getActiveProfiles()).contains("prod");
        if (isProd) {
            validateProductionConfig(parsed);
        }

        if (isLocalhost(parsed.jdbcUrl())) {
            log.warn("[DataSourceConfig] No remote DATABASE_URL configured. Falling back to local PostgreSQL at: {}",
                    parsed.jdbcUrl());
        } else {
            log.info("[DataSourceConfig] Initializing PostgreSQL DataSource with target JDBC URL: {}",
                    DatabaseUrlParser.maskJdbcUrl(parsed.jdbcUrl()));
        }

        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setJdbcUrl(parsed.jdbcUrl());
        hikariConfig.setUsername(parsed.username());
        hikariConfig.setPassword(parsed.password());
        hikariConfig.setDriverClassName("org.postgresql.Driver");

        hikariConfig.setMaximumPoolSize(5);
        hikariConfig.setMinimumIdle(1);
        hikariConfig.setIdleTimeout(30000);
        hikariConfig.setMaxLifetime(60000);
        hikariConfig.setConnectionTimeout(30000);
        hikariConfig.setPoolName("SlotPlayHikariPool");
        hikariConfig.addDataSourceProperty("stringtype", "unspecified");

        return new HikariDataSource(hikariConfig);
    }

    private void validateProductionConfig(DatabaseUrlParser.ParsedDatabaseConfig parsed) {
        if (parsed.username() == null || parsed.username().trim().isEmpty() || "postgres".equalsIgnoreCase(parsed.username())) {
            log.warn("[DataSourceConfig] Production profile active with default/empty database username");
        }
        if (parsed.password() == null || parsed.password().trim().isEmpty() || "postgres".equalsIgnoreCase(parsed.password())) {
            throw new IllegalStateException("Production database configuration error: Default or empty database password is not permitted in production.");
        }
        if (parsed.jdbcUrl().contains("localhost") || parsed.jdbcUrl().contains("127.0.0.1")) {
            throw new IllegalStateException("Production database configuration error: Database URL cannot point to localhost in production.");
        }
        if (!parsed.jdbcUrl().contains("sslmode=require") && !parsed.jdbcUrl().contains("ssl=true")) {
            throw new IllegalStateException("Production database configuration error: SSL connection (sslmode=require) is required for hosted production PostgreSQL.");
        }
    }
}
