package com.interviewer.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "questions")
public class Question {

    @Id
    private String id;
    private String roleCategory;
    private String difficulty;
    private String questionText;
    private List<String> expectedKeywords;
    private String idealAnswer;
    private int maxScore;
    private int timeLimitSeconds;

    public Question() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRoleCategory() { return roleCategory; }
    public void setRoleCategory(String roleCategory) { this.roleCategory = roleCategory; }
    public String getDifficulty() { return difficulty; }
    public void setDifficulty(String difficulty) { this.difficulty = difficulty; }
    public String getQuestionText() { return questionText; }
    public void setQuestionText(String questionText) { this.questionText = questionText; }
    public List<String> getExpectedKeywords() { return expectedKeywords; }
    public void setExpectedKeywords(List<String> expectedKeywords) { this.expectedKeywords = expectedKeywords; }
    public String getIdealAnswer() { return idealAnswer; }
    public void setIdealAnswer(String idealAnswer) { this.idealAnswer = idealAnswer; }
    public int getMaxScore() { return maxScore; }
    public void setMaxScore(int maxScore) { this.maxScore = maxScore; }
    public int getTimeLimitSeconds() { return timeLimitSeconds; }
    public void setTimeLimitSeconds(int timeLimitSeconds) { this.timeLimitSeconds = timeLimitSeconds; }
}
