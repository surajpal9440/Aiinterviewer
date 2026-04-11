package com.interviewer.service;

import com.interviewer.dto.ProctorEventRequest;
import com.interviewer.model.InterviewSession;
import com.interviewer.model.ProctorEvent;
import com.interviewer.repository.ProctorEventRepository;
import com.interviewer.repository.SessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ProctoringService {

    @Autowired
    private ProctorEventRepository proctorEventRepository;

    @Autowired
    private SessionRepository sessionRepository;

    // Deduction values for each event type
    private static final Map<String, Integer> DEDUCTIONS = Map.of(
            "TAB_SWITCH", 10,
            "NO_FACE", 5,
            "MULTIPLE_FACES", 15,
            "LOOKING_AWAY", 3,
            "LOOKING_DOWN", 2,
            "BACKGROUND_NOISE", 2
    );

    /**
     * Log a proctoring event and update integrity score
     */
    public Map<String, Object> logEvent(ProctorEventRequest request) {
        // Save the event
        ProctorEvent event = new ProctorEvent();
        event.setSessionId(request.getSessionId());
        event.setEventType(request.getEventType());
        event.setSeverity(request.getSeverity());
        event.setDescription(request.getDescription() != null ?
                request.getDescription() :
                getDefaultDescription(request.getEventType()));

        proctorEventRepository.save(event);

        // Update session integrity score
        InterviewSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        int deduction = DEDUCTIONS.getOrDefault(request.getEventType(), 2);
        int newScore = Math.max(0, session.getIntegrityScore() - deduction);
        session.setIntegrityScore(newScore);
        session.setWarningCount(session.getWarningCount() + 1);
        sessionRepository.save(session);

        // Build response
        Map<String, Object> result = new HashMap<>();
        result.put("integrityScore", newScore);
        result.put("warningCount", session.getWarningCount());
        result.put("warning", getWarningMessage(request.getEventType()));
        result.put("deduction", deduction);
        return result;
    }

    /**
     * Get integrity score for a session
     */
    public Map<String, Object> getIntegrityScore(String sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Map<String, Object> result = new HashMap<>();
        result.put("integrityScore", session.getIntegrityScore());
        result.put("warningCount", session.getWarningCount());
        return result;
    }

    /**
     * Calculate integrity score from events (used for reports)
     */
    public int calculateIntegrity(int tabSwitches, int noFace, int multipleFaces, int lookingAway) {
        int deduction = (tabSwitches * 10) + (noFace * 5) + (multipleFaces * 15) + (lookingAway * 3);
        return Math.max(0, 100 - deduction);
    }

    /**
     * Get proctoring summary for report
     */
    public Map<String, Integer> getProctoringSummary(String sessionId) {
        Map<String, Integer> summary = new HashMap<>();
        summary.put("tabSwitches", (int) proctorEventRepository.countBySessionIdAndEventType(sessionId, "TAB_SWITCH"));
        summary.put("noFaceCount", (int) proctorEventRepository.countBySessionIdAndEventType(sessionId, "NO_FACE"));
        summary.put("multipleFaces", (int) proctorEventRepository.countBySessionIdAndEventType(sessionId, "MULTIPLE_FACES"));
        summary.put("lookingAway", (int) proctorEventRepository.countBySessionIdAndEventType(sessionId, "LOOKING_AWAY"));
        summary.put("lookingDown", (int) proctorEventRepository.countBySessionIdAndEventType(sessionId, "LOOKING_DOWN"));

        List<ProctorEvent> allEvents = proctorEventRepository.findBySessionId(sessionId);
        summary.put("totalWarnings", allEvents.size());

        return summary;
    }

    private String getDefaultDescription(String eventType) {
        return switch (eventType) {
            case "TAB_SWITCH" -> "User switched to another tab or window";
            case "NO_FACE" -> "No face detected in camera view";
            case "MULTIPLE_FACES" -> "Multiple faces detected in camera view";
            case "LOOKING_AWAY" -> "User is looking away from screen";
            case "LOOKING_DOWN" -> "User is looking down frequently";
            case "BACKGROUND_NOISE" -> "Background noise or multiple voices detected";
            default -> "Suspicious activity detected";
        };
    }

    private String getWarningMessage(String eventType) {
        return switch (eventType) {
            case "TAB_SWITCH" -> "⚠️ WARNING: Tab switching detected! Stay on the interview page.";
            case "NO_FACE" -> "⚠️ WARNING: Face not detected! Please face the camera.";
            case "MULTIPLE_FACES" -> "🚨 ALERT: Multiple faces detected! Only you should be visible.";
            case "LOOKING_AWAY" -> "⚠️ WARNING: Please look at the screen.";
            case "LOOKING_DOWN" -> "⚠️ NOTICE: Frequent looking down detected.";
            case "BACKGROUND_NOISE" -> "⚠️ NOTICE: Background noise detected. Move to a quieter place.";
            default -> "⚠️ Suspicious activity detected.";
        };
    }
}
