package com.interviewer.service;

import com.interviewer.model.*;
import com.interviewer.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportService {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private ReportRepository reportRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private ProctoringService proctoringService;

    @Autowired
    private AnalysisService analysisService;

    /**
     * Generate a complete interview report
     */
    public InterviewReport generateReport(String sessionId) {
        // Check if report already exists
        Optional<InterviewReport> existing = reportRepository.findBySessionId(sessionId);
        if (existing.isPresent()) {
            return existing.get();
        }

        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        List<InterviewAnswer> answers = answerRepository.findBySessionId(sessionId);

        // --- Calculate Technical Score ---
        int totalScore = answers.stream().mapToInt(InterviewAnswer::getScore).sum();
        int totalMaxScore = answers.stream().mapToInt(InterviewAnswer::getMaxScore).sum();
        int technicalScore = totalMaxScore > 0 ? (int) Math.round((double) totalScore / totalMaxScore * 100) : 0;

        // --- Calculate Communication Score ---
        int communicationScore = 0;
        if (!answers.isEmpty()) {
            communicationScore = (int) answers.stream()
                    .mapToInt(a -> analysisService.calculateCommunicationScore(a.getAnswerText()))
                    .average()
                    .orElse(0);
        }

        // --- Calculate Confidence Score ---
        int confidenceScore = 0;
        if (!answers.isEmpty()) {
            confidenceScore = (int) answers.stream()
                    .mapToInt(a -> {
                        Question q = questionRepository.findById(a.getQuestionId()).orElse(null);
                        int timeLimit = (q != null) ? q.getTimeLimitSeconds() : 120;
                        return analysisService.calculateConfidenceScore(
                                a.getTimeTakenSeconds(), timeLimit, a.getAnswerText());
                    })
                    .average()
                    .orElse(0);
        }

        // --- Get Integrity Score ---
        int integrityScore = session.getIntegrityScore();

        // --- Calculate Overall Score ---
        int overallScore = (int) Math.round(
                technicalScore * 0.4 +
                communicationScore * 0.2 +
                confidenceScore * 0.2 +
                integrityScore * 0.2
        );

        // --- Identify Strengths & Weaknesses ---
        List<String> strengths = new ArrayList<>();
        List<String> weaknesses = new ArrayList<>();

        for (InterviewAnswer answer : answers) {
            double pct = answer.getMaxScore() > 0 ?
                    (double) answer.getScore() / answer.getMaxScore() * 100 : 0;
            // Extract topic from question
            String topic = extractTopic(answer.getQuestionText());
            if (pct >= 70) {
                if (!strengths.contains(topic)) strengths.add(topic);
            } else if (pct < 50) {
                if (!weaknesses.contains(topic)) weaknesses.add(topic);
            }
        }

        // --- Count correct answers ---
        long correctCount = answers.stream()
                .filter(a -> a.getMaxScore() > 0 && (double) a.getScore() / a.getMaxScore() >= 0.7)
                .count();

        // --- Get proctoring summary ---
        Map<String, Integer> proctoringSummary = proctoringService.getProctoringSummary(sessionId);

        // --- Calculate duration ---
        int durationMinutes = 0;
        if (session.getStartedAt() != null && session.getEndedAt() != null) {
            durationMinutes = (int) Duration.between(session.getStartedAt(), session.getEndedAt()).toMinutes();
        }

        // --- Build and save report ---
        InterviewReport report = new InterviewReport();
        report.setSessionId(sessionId);
        report.setUserId(session.getUserId());
        report.setRoleCategory(session.getRoleCategory());
        report.setTechnicalScore(technicalScore);
        report.setCommunicationScore(communicationScore);
        report.setConfidenceScore(confidenceScore);
        report.setIntegrityScore(integrityScore);
        report.setOverallScore(overallScore);
        report.setTotalQuestions(answers.size());
        report.setCorrectAnswers((int) correctCount);
        report.setStrengths(strengths.isEmpty() ? List.of("Keep practicing!") : strengths);
        report.setWeaknesses(weaknesses.isEmpty() ? List.of("Great job overall!") : weaknesses);
        report.setProctoringSummary(proctoringSummary);
        report.setDurationMinutes(durationMinutes);

        return reportRepository.save(report);
    }

    /**
     * Get report by session ID
     */
    public InterviewReport getReport(String sessionId) {
        return reportRepository.findBySessionId(sessionId)
                .orElseGet(() -> generateReport(sessionId));
    }

    /**
     * Get all reports for a user
     */
    public List<InterviewReport> getUserReports(String userId) {
        return reportRepository.findByUserId(userId);
    }

    /**
     * Extract topic from question text
     */
    private String extractTopic(String questionText) {
        if (questionText == null) return "General";

        String lower = questionText.toLowerCase();

        // Common Java topics
        if (lower.contains("oop") || lower.contains("object oriented") || lower.contains("polymorphism") ||
            lower.contains("inheritance") || lower.contains("encapsulation") || lower.contains("abstraction")) {
            return "OOP Concepts";
        }
        if (lower.contains("collection") || lower.contains("list") || lower.contains("map") ||
            lower.contains("set") || lower.contains("arraylist") || lower.contains("hashmap")) {
            return "Collections Framework";
        }
        if (lower.contains("thread") || lower.contains("synchron") || lower.contains("concurrent")) {
            return "Multithreading";
        }
        if (lower.contains("exception") || lower.contains("try") || lower.contains("catch") || lower.contains("throw")) {
            return "Exception Handling";
        }
        if (lower.contains("spring") || lower.contains("boot") || lower.contains("bean") || lower.contains("autowired")) {
            return "Spring Framework";
        }
        if (lower.contains("database") || lower.contains("sql") || lower.contains("query") || lower.contains("mongodb")) {
            return "Database";
        }
        if (lower.contains("rest") || lower.contains("api") || lower.contains("http") || lower.contains("endpoint")) {
            return "REST APIs";
        }
        if (lower.contains("design pattern") || lower.contains("singleton") || lower.contains("factory") || lower.contains("strategy")) {
            return "Design Patterns";
        }
        if (lower.contains("html") || lower.contains("css") || lower.contains("javascript") || lower.contains("dom")) {
            return "Web Development";
        }
        if (lower.contains("react") || lower.contains("angular") || lower.contains("vue") || lower.contains("frontend")) {
            return "Frontend Development";
        }
        if (lower.contains("node") || lower.contains("express") || lower.contains("backend")) {
            return "Backend Development";
        }
        if (lower.contains("teamwork") || lower.contains("leadership") || lower.contains("conflict") ||
            lower.contains("strength") || lower.contains("weakness") || lower.contains("tell me about")) {
            return "Behavioral / HR";
        }

        return "General Knowledge";
    }
}
