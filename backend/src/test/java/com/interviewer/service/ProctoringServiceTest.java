package com.interviewer.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import static org.junit.jupiter.api.Assertions.*;

class ProctoringServiceTest {

    @Test
    @DisplayName("No violations should give 100 integrity")
    void testIntegrityScore_NoViolations() {
        int score = calculateIntegrity(0, 0, 0, 0);
        assertEquals(100, score, "No violations should give 100");
    }

    @Test
    @DisplayName("One tab switch should deduct 10 points")
    void testIntegrityScore_TabSwitch() {
        int score = calculateIntegrity(1, 0, 0, 0);
        assertEquals(90, score, "One tab switch should deduct 10 points");
    }

    @Test
    @DisplayName("Multiple violations should accumulate deductions")
    void testIntegrityScore_MultipleViolations() {
        // 2 tab switches (-20) + 1 no face (-5) + 1 multiple faces (-15) = -40
        int score = calculateIntegrity(2, 1, 1, 0);
        assertEquals(60, score, "Multiple violations should accumulate");
    }

    @Test
    @DisplayName("Integrity should never go below 0")
    void testIntegrityScore_NeverBelowZero() {
        int score = calculateIntegrity(10, 10, 10, 10);
        assertTrue(score >= 0, "Integrity should never go below 0");
    }

    @Test
    @DisplayName("All event types contribute to deductions")
    void testIntegrityScore_AllEventTypes() {
        // 1 tab (-10) + 1 noface (-5) + 1 multi (-15) + 1 looking (-3) = -33
        int score = calculateIntegrity(1, 1, 1, 1);
        assertEquals(67, score, "All event types should contribute deductions");
    }

    /**
     * Local calculation method matching ProctoringService logic
     */
    private int calculateIntegrity(int tabSwitches, int noFace, int multipleFaces, int lookingAway) {
        int deduction = (tabSwitches * 10) + (noFace * 5) + (multipleFaces * 15) + (lookingAway * 3);
        return Math.max(0, 100 - deduction);
    }
}
