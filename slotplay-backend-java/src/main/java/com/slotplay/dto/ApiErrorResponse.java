package com.slotplay.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private boolean success = false;
    private String message;
    private String code;
    private Map<String, List<String>> errors;

    public ApiErrorResponse() {
    }

    public ApiErrorResponse(String message) {
        this.message = message;
    }

    public ApiErrorResponse(String message, String code) {
        this.message = message;
        this.code = code;
    }

    public ApiErrorResponse(String message, String code, Map<String, List<String>> errors) {
        this.message = message;
        this.code = code;
        this.errors = errors;
    }

    public static ApiErrorResponse of(String message, String code) {
        return new ApiErrorResponse(message, code);
    }

    public static ApiErrorResponse of(String message, String code, Map<String, List<String>> errors) {
        return new ApiErrorResponse(message, code, errors);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public Map<String, List<String>> getErrors() {
        return errors;
    }

    public void setErrors(Map<String, List<String>> errors) {
        this.errors = errors;
    }
}
