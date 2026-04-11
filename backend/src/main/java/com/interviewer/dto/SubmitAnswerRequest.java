package com.interviewer.dto;

import jakarta.validation.constraints.NotBlank;

public class SubmitAnswerRequest {

    @NotBlank(message = "Question ID is required")
    private String questionId;

    @NotBlank(message = "Answer text is required")
    private String answerText;

    private int timeTakenSeconds;

    public SubmitAnswerRequest() {}

    public String getQuestionId() { return questionId; }
    public void setQuestionId(String questionId) { this.questionId = questionId; }
    public String getAnswerText() { return answerText; }
    public void setAnswerText(String answerText) { this.answerText = answerText; }
    public int getTimeTakenSeconds() { return timeTakenSeconds; }
    public void setTimeTakenSeconds(int timeTakenSeconds) { this.timeTakenSeconds = timeTakenSeconds; }
}
