package com.interviewer.enums;

public enum RoleCategory {
    JAVA_DEVELOPER("Java Developer"),
    FRONTEND_DEVELOPER("Frontend Developer"),
    BACKEND_DEVELOPER("Backend Developer"),
    MERN_STACK_DEVELOPER("MERN Stack Developer"),
    HR("HR / Behavioral");

    private final String displayName;

    RoleCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
