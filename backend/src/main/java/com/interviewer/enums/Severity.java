package com.interviewer.enums;

public enum Severity {
    LOW(2),
    MEDIUM(5),
    HIGH(10);

    private final int defaultDeduction;

    Severity(int defaultDeduction) {
        this.defaultDeduction = defaultDeduction;
    }

    public int getDefaultDeduction() {
        return defaultDeduction;
    }
}
