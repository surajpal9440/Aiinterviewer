package com.interviewer.controller;

import com.interviewer.model.InterviewReport;
import com.interviewer.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/report")
public class ReportController {

    @Autowired
    private ReportService reportService;

    /**
     * Get or generate report for a session
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<?> getReport(@PathVariable String sessionId) {
        try {
            InterviewReport report = reportService.getReport(sessionId);
            return ResponseEntity.ok(report);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all reports for the logged-in user
     */
    @GetMapping("/my-reports")
    public ResponseEntity<?> getMyReports(Authentication authentication) {
        try {
            String userId = authentication.getPrincipal().toString();
            List<InterviewReport> reports = reportService.getUserReports(userId);
            return ResponseEntity.ok(reports);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
