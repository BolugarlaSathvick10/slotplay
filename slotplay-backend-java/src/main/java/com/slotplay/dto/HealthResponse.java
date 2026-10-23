package com.slotplay.dto;

public class HealthResponse {

    private String status;
    private String timestamp;
    private String environment;
    private String database;

    public HealthResponse() {
    }

    public HealthResponse(String status, String timestamp, String environment, String database) {
        this.status = status;
        this.timestamp = timestamp;
        this.environment = environment;
        this.database = database;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getEnvironment() {
        return environment;
    }

    public void setEnvironment(String environment) {
        this.environment = environment;
    }

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String database) {
        this.database = database;
    }
}
