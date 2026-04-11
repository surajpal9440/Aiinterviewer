package com.interviewer.dto;

import java.util.List;

public class SubmitAnswerResponse {
    private int score;
    private int maxScore;
    private List<String> keywordsMatched;
    private List<String> keywordsMissed;
    private String feedback;
    private String nextDifficulty;
    private boolean interviewComplete;

    public SubmitAnswerResponse() {}

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
    public int getMaxScore() { return maxScore; }
    public void setMaxScore(int maxScore) { this.maxScore = maxScore; }
    public List<String> getKeywordsMatched() { return keywordsMatched; }
    public void setKeywordsMatched(List<String> keywordsMatched) { this.keywordsMatched = keywordsMatched; }
    public List<String> getKeywordsMissed() { return keywordsMissed; }
    public void setKeywordsMissed(List<String> keywordsMissed) { this.keywordsMissed = keywordsMissed; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
    public String getNextDifficulty() { return nextDifficulty; }
    public void setNextDifficulty(String nextDifficulty) { this.nextDifficulty = nextDifficulty; }
    public boolean isInterviewComplete() { return interviewComplete; }
    public void setInterviewComplete(boolean interviewComplete) { this.interviewComplete = interviewComplete; }
}
