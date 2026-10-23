package com.slotplay.exception;

import com.slotplay.dto.ApiErrorResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ApiErrorResponse> handleAppException(AppException ex) {
        if (ex.getStatus().is5xxServerError()) {
            log.error("[AppException] {} - Code: {}", ex.getMessage(), ex.getCode(), ex);
        } else {
            log.warn("[AppException] {} - Code: {}", ex.getMessage(), ex.getCode());
        }

        ApiErrorResponse body = ApiErrorResponse.of(ex.getMessage(), ex.getCode(), ex.getErrors());
        return ResponseEntity.status(ex.getStatus()).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, List<String>> errors = new HashMap<>();

        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.computeIfAbsent(fieldError.getField(), k -> new ArrayList<>())
                    .add(fieldError.getDefaultMessage());
        }

        String firstMessage = "Validation failed";
        if (!errors.isEmpty()) {
            Map.Entry<String, List<String>> first = errors.entrySet().iterator().next();
            firstMessage = first.getKey() + ": " + (first.getValue().isEmpty() ? "Invalid value" : first.getValue().get(0));
        }

        log.warn("[Validation] Validation failed: {}", errors);
        ApiErrorResponse body = ApiErrorResponse.of(firstMessage, "VALIDATION_ERROR", errors);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(DataIntegrityViolationException ex) {
        log.warn("[DataIntegrityViolation] Constraint violation: {}", ex.getMessage());
        ApiErrorResponse body = ApiErrorResponse.of("Database constraint conflict or duplicate entry", "CONFLICT");
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiErrorResponse> handleNoResourceFound(NoResourceFoundException ex) {
        ApiErrorResponse body = ApiErrorResponse.of("Route not found", "NOT_FOUND");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
        ApiErrorResponse body = ApiErrorResponse.of("HTTP method not supported: " + ex.getMethod(), "METHOD_NOT_ALLOWED");
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(body);
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ApiErrorResponse> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        log.warn("[AccessDenied] Forbidden access: {}", ex.getMessage());
        ApiErrorResponse body = ApiErrorResponse.of("You do not have permission to perform this action", "FORBIDDEN");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(org.springframework.security.core.AuthenticationException.class)
    public ResponseEntity<ApiErrorResponse> handleAuthentication(org.springframework.security.core.AuthenticationException ex) {
        log.warn("[Authentication] Unauthorized access: {}", ex.getMessage());
        ApiErrorResponse body = ApiErrorResponse.of("Not authenticated", "UNAUTHORISED");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(body);
    }

    @ExceptionHandler(EmailDeliveryException.class)
    public ResponseEntity<ApiErrorResponse> handleEmailDeliveryException(EmailDeliveryException ex) {
        log.error("[EmailDelivery] Failed to deliver email: {}", ex.getMessage());
        ApiErrorResponse body = ApiErrorResponse.of("Email service is temporarily unavailable. Please try again later.", "EMAIL_DELIVERY_FAILED");
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(Exception ex) {
        log.error("[UnhandledException] An unexpected error occurred", ex);
        ApiErrorResponse body = ApiErrorResponse.of("An unexpected error occurred. Please try again later.", "INTERNAL_ERROR");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}
