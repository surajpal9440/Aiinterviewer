package com.interviewer.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "interview_answers")
public class InterviewAnswer {

    @Id
    private String id;
    private String sessionId;
    private String userId;
    private String questionId;
    private String questionText;
    private String answerText;
    private int score;
    private int maxScore;
    private List<String> keywordsMatched;
    private List<String> keywordsMissed;
    private int timeTakenSeconds;
    private LocalDateTime timestamp = LocalDateTime.now();

    public InterviewAnswer() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getMaxScore() { return maxScore; }
    public void setMaxScore(int maxScore) { this.maxScore = maxScore; }
    public List<String> getKeywordsMatched() { return keywordsMatched; }
    public void setKeywordsMatched(List<String> keywordsMatched) { this.keywordsMatched = keywordsMatched; }
    public List<String> getKeywordsMissed() { return keywordsMissed; }
    public void setKeywordsMissed(List<String> keywordsMissed) { this.keywordsMissed = keywordsMissed; }
    public int getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(int timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
