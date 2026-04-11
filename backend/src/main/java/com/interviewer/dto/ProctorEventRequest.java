package com.interviewer.dto;

import jakarta.validation.constraints.NotBlank;

public class ProctorEventRequest {

    @NotBlank
    private String sessionId;

    @NotBlank
    private String eventType;

    private String severity;
    private String description;

    public ProctorEventRequest() {}

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
