package com.slotplay.controller;

import com.slotplay.dto.ApiErrorResponse;
import com.slotplay.dto.ApiResponse;
import com.slotplay.dto.HealthResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Instant;

@RestController
@RequestMapping("/api/health")
@Tag(name = "Health", description = "System health and database availability endpoints")
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final DataSource dataSource;

    @Value("${spring.profiles.active:development}")
    private String activeProfile;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping
    @Operation(summary = "Check API and Database Health")
    public ResponseEntity<?> checkHealth() {
        try (Connection connection = dataSource.getConnection()) {
            boolean isValid = connection.isValid(2);
            if (!isValid) {
                log.error("[Health] Database connection validation failed");
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body(ApiErrorResponse.of("Service unavailable — database connection failed", "DB_UNAVAILABLE"));
            }

            HealthResponse data = new HealthResponse(
                    "ok",
                    Instant.now().toString(),
                    activeProfile,
                    "connected"
            );

            return ResponseEntity.ok(ApiResponse.success(data));
        } catch (Exception ex) {
            log.error("[Health] Database health ping failed", ex);
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(ApiErrorResponse.of("Service unavailable — database connection failed", "DB_UNAVAILABLE"));
        }
    }
}
