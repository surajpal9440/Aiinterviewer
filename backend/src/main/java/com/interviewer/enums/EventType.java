package com.interviewer.enums;

public enum EventType {
    NO_FACE("No Face Detected"),
    MULTIPLE_FACES("Multiple Faces Detected"),
    LOOKING_AWAY("Looking Away"),
    LOOKING_DOWN("Looking Down"),
    TAB_SWITCH("Tab Switch Detected"),
    BACKGROUND_NOISE("Background Noise Detected");

    private final String description;

    EventType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
