package com.slotplay.exception;

import org.springframework.http.HttpStatus;

import java.util.List;
import java.util.Map;

public class AppException extends RuntimeException {

    private final HttpStatus status;
    private final String code;
    private final Map<String, List<String>> errors;

    public AppException(String message, HttpStatus status, String code) {
        super(message);
        this.status = status;
        this.code = code;
        this.errors = null;
    }

    public AppException(String message, HttpStatus status, String code, Map<String, List<String>> errors) {
        super(message);
        this.status = status;
        this.code = code;
        this.errors = errors;
    }

    public static AppException badRequest(String message) {
        return new AppException(message, HttpStatus.BAD_REQUEST, "BAD_REQUEST");
    }

    public static AppException unauthorized(String message) {
        return new AppException(message, HttpStatus.UNAUTHORIZED, "UNAUTHORISED");
    }

    public static AppException forbidden(String message) {
        return new AppException(message, HttpStatus.FORBIDDEN, "FORBIDDEN");
    }

    public static AppException notFound(String resourceName) {
        return new AppException(resourceName + " not found", HttpStatus.NOT_FOUND, "NOT_FOUND");
    }

    public static AppException conflict(String message) {
        return new AppException(message, HttpStatus.CONFLICT, "CONFLICT");
    }

    public static AppException validationError(String message, Map<String, List<String>> errors) {
        return new AppException(message, HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", errors);
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public Map<String, List<String>> getErrors() {
        return errors;
    }
}
