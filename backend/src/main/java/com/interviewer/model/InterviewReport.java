package com.interviewer.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Document(collection = "interview_reports")
public class InterviewReport {

    @Id
    private String id;
    private String sessionId;
    private String userId;
    private String roleCategory;
    private int technicalScore;
    private int communicationScore;
    private int confidenceScore;
    private int integrityScore;
    private int overallScore;
    private int totalQuestions;
    private int correctAnswers;
    private List<String> strengths;
    private List<String> weaknesses;
    private Map<String, Integer> proctoringSummary;
    private int durationMinutes;
    private LocalDateTime generatedAt = LocalDateTime.now();

    public InterviewReport() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRoleCategory() { return roleCategory; }
    public void setRoleCategory(String roleCategory) { this.roleCategory = roleCategory; }
    public int getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(int technicalScore) { this.technicalScore = technicalScore; }
    public int getCommunicationScore() { return communicationScore; }
    public void setCommunicationScore(int communicationScore) { this.communicationScore = communicationScore; }
    public int getConfidenceScore() { return confidenceScore; }
    public void setConfidenceScore(int confidenceScore) { this.confidenceScore = confidenceScore; }
    public int getIntegrityScore() { return integrityScore; }
    public void setIntegrityScore(int integrityScore) { this.integrityScore = integrityScore; }
    public int getOverallScore() { return overallScore; }
    public void setOverallScore(int overallScore) { this.overallScore = overallScore; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public int getCorrectAnswers() { return correctAnswers; }
    public void setCorrectAnswers(int correctAnswers) { this.correctAnswers = correctAnswers; }
    public List<String> getStrengths() { return strengths; }
    public void setStrengths(List<String> strengths) { this.strengths = strengths; }
    public List<String> getWeaknesses() { return weaknesses; }
    public void setWeaknesses(List<String> weaknesses) { this.weaknesses = weaknesses; }
    public Map<String, Integer> getProctoringSummary() { return proctoringSummary; }
    public void setProctoringSummary(Map<String, Integer> proctoringSummary) { this.proctoringSummary = proctoringSummary; }
    public int getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(int durationMinutes) { this.durationMinutes = durationMinutes; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}
