package com.interviewer.controller;

import com.interviewer.dto.ProctorEventRequest;
import com.interviewer.service.ProctoringService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/proctor")
public class ProctoringController {

    @Autowired
    private ProctoringService proctoringService;

    /**
     * Log a proctoring event
     */
    @PostMapping("/event")
    public ResponseEntity<?> logEvent(@Valid @RequestBody ProctorEventRequest request) {
        try {
            Map<String, Object> result = proctoringService.logEvent(request);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get current integrity score
     */
    @GetMapping("/{sessionId}/score")
    public ResponseEntity<?> getIntegrityScore(@PathVariable String sessionId) {
        try {
            Map<String, Object> result = proctoringService.getIntegrityScore(sessionId);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
