package com.interviewer.controller;

import com.interviewer.dto.StartInterviewRequest;
import com.interviewer.dto.SubmitAnswerRequest;
import com.interviewer.dto.SubmitAnswerResponse;
import com.interviewer.service.InterviewService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/interview")
public class InterviewController {

    private static final Logger logger = LoggerFactory.getLogger(InterviewController.class);

    @Autowired
    private InterviewService interviewService;

    /**
     * Start a new interview
     */
    @PostMapping("/start")
    public ResponseEntity<?> startInterview(@Valid @RequestBody StartInterviewRequest request,
                                            Authentication authentication) {
        try {
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }
            String userId = authentication.getPrincipal().toString();
            logger.info("Starting interview for user: {}, role: {}", userId, request.getRoleCategory());
            Map<String, Object> result = interviewService.startInterview(userId, request.getRoleCategory());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error starting interview: ", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null ? e.getMessage() : "Internal server error");
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Get next question
     */
    @GetMapping("/{sessionId}/next")
    public ResponseEntity<?> getNextQuestion(@PathVariable String sessionId) {
        try {
            Map<String, Object> result = interviewService.getNextQuestion(sessionId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Error getting next question for session {}: ", sessionId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null ? e.getMessage() : "Internal server error");
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * Submit an answer
     */
    @PostMapping("/{sessionId}/submit")
    public ResponseEntity<?> submitAnswer(@PathVariable String sessionId,
                                          @Valid @RequestBody SubmitAnswerRequest request,
                                          Authentication authentication) {
        try {
            if (authentication == null || authentication.getPrincipal() == null) {
                return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
            }
            String userId = authentication.getPrincipal().toString();
            SubmitAnswerResponse response = interviewService.submitAnswer(sessionId, userId, request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error submitting answer for session {}: ", sessionId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null ? e.getMessage() : "Internal server error");
            return ResponseEntity.badRequest().body(error);
        }
    }

    /**
     * End interview early
     */
    @PostMapping("/{sessionId}/end")
    public ResponseEntity<?> endInterview(@PathVariable String sessionId) {
        try {
            interviewService.endInterview(sessionId);
            return ResponseEntity.ok(Map.of("message", "Interview ended successfully"));
        } catch (Exception e) {
            logger.error("Error ending interview for session {}: ", sessionId, e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage() != null ? e.getMessage() : "Internal server error");
            return ResponseEntity.badRequest().body(error);
        }
    }
}
