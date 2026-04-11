package com.interviewer.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "interview_sessions")
public class InterviewSession {

    @Id
    private String id;
    private String userId;
    private String roleCategory;
    private String status = "IN_PROGRESS";
    private int currentQuestionIndex = 0;
    private String currentDifficulty = "EASY";
    private int consecutiveCorrect = 0;
    private int consecutiveWrong = 0;
    private List<String> answeredQuestionIds = new ArrayList<>();
    private int integrityScore = 100;
    private int warningCount = 0;
    private int totalQuestions = 10;
    private LocalDateTime startedAt = LocalDateTime.now();
    private LocalDateTime endedAt;

    public InterviewSession() {}

    // Adaptive difficulty helpers
    public void incrementConsecutiveCorrect() { this.consecutiveCorrect++; this.consecutiveWrong = 0; }
    public void incrementConsecutiveWrong() { this.consecutiveWrong++; this.consecutiveCorrect = 0; }

    public void upgradeDifficulty() {
        switch (this.currentDifficulty) {
            case "EASY" -> this.currentDifficulty = "MEDIUM";
            case "MEDIUM" -> this.currentDifficulty = "HARD";
        }
        this.consecutiveCorrect = 0;
    }

    public void downgradeDifficulty() {
        switch (this.currentDifficulty) {
            case "HARD" -> this.currentDifficulty = "MEDIUM";
            case "MEDIUM" -> this.currentDifficulty = "EASY";
        }
        this.consecutiveWrong = 0;
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRoleCategory() { return roleCategory; }
    public void setRoleCategory(String roleCategory) { this.roleCategory = roleCategory; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getCurrentQuestionIndex() { return currentQuestionIndex; }
    public void setCurrentQuestionIndex(int currentQuestionIndex) { this.currentQuestionIndex = currentQuestionIndex; }
    public String getCurrentDifficulty() { return currentDifficulty; }
    public void setCurrentDifficulty(String currentDifficulty) { this.currentDifficulty = currentDifficulty; }
    public int getConsecutiveCorrect() { return consecutiveCorrect; }
    public void setConsecutiveCorrect(int consecutiveCorrect) { this.consecutiveCorrect = consecutiveCorrect; }
    public int getConsecutiveWrong() { return consecutiveWrong; }
    public void setConsecutiveWrong(int consecutiveWrong) { this.consecutiveWrong = consecutiveWrong; }
    public List<String> getAnsweredQuestionIds() { return answeredQuestionIds; }
    public void setAnsweredQuestionIds(List<String> answeredQuestionIds) { this.answeredQuestionIds = answeredQuestionIds; }
    public int getIntegrityScore() { return integrityScore; }
    public void setIntegrityScore(int integrityScore) { this.integrityScore = integrityScore; }
    public int getWarningCount() { return warningCount; }
    public void setWarningCount(int warningCount) { this.warningCount = warningCount; }
    public int getTotalQuestions() { return totalQuestions; }
    public void setTotalQuestions(int totalQuestions) { this.totalQuestions = totalQuestions; }
    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }
    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }
}
