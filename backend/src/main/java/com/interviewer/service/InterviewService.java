package com.interviewer.service;

import com.interviewer.dto.SubmitAnswerRequest;
import com.interviewer.dto.SubmitAnswerResponse;
import com.interviewer.factory.QuestionFactory;
import com.interviewer.model.*;
import com.interviewer.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class InterviewService {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private AnswerRepository answerRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionFactory questionFactory;

    @Autowired
    private AnalysisService analysisService;

    /**
     * Start a new interview session
     */
    public Map<String, Object> startInterview(String userId, String roleCategory) {
        // Create new session
        InterviewSession session = new InterviewSession();
        session.setUserId(userId);
        session.setRoleCategory(roleCategory);
        session.setStatus("IN_PROGRESS");
        session.setCurrentDifficulty("EASY");
        session.setIntegrityScore(100);

        InterviewSession saved = sessionRepository.save(session);

        // Get first question
        Question firstQuestion = questionFactory.getNextQuestion(
                roleCategory, "EASY", saved.getAnsweredQuestionIds());

        Map<String, Object> result = new HashMap<>();
        result.put("sessionId", saved.getId());
        result.put("totalQuestions", saved.getTotalQuestions());

        if (firstQuestion != null) {
            result.put("question", buildQuestionMap(firstQuestion, 1, "EASY"));
        }

        return result;
    }

    /**
     * Get next question for a session
     */
    public Map<String, Object> getNextQuestion(String sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        if ("COMPLETED".equals(session.getStatus()) || "TERMINATED".equals(session.getStatus())) {
            Map<String, Object> result = new HashMap<>();
            result.put("interviewComplete", true);
            result.put("message", "Interview is already completed");
            return result;
        }

        int questionNumber = session.getCurrentQuestionIndex() + 1;

        if (questionNumber > session.getTotalQuestions()) {
            // All questions answered
            session.setStatus("COMPLETED");
            session.setEndedAt(LocalDateTime.now());
            sessionRepository.save(session);

            Map<String, Object> result = new HashMap<>();
            result.put("interviewComplete", true);
            result.put("message", "All questions have been answered");
            return result;
        }

        Question next = questionFactory.getNextQuestion(
                session.getRoleCategory(),
                session.getCurrentDifficulty(),
                session.getAnsweredQuestionIds());

        Map<String, Object> result = new HashMap<>();
        if (next != null) {
            result.put("question", buildQuestionMap(next, questionNumber, session.getCurrentDifficulty()));
            result.put("interviewComplete", false);
        } else {
            session.setStatus("COMPLETED");
            session.setEndedAt(LocalDateTime.now());
            sessionRepository.save(session);
            result.put("interviewComplete", true);
            result.put("message", "No more questions available");
        }
        result.put("integrityScore", session.getIntegrityScore());
        return result;
    }

    /**
     * Submit an answer and get the score
     */
    @SuppressWarnings("unchecked")
    public SubmitAnswerResponse submitAnswer(String sessionId, String userId, SubmitAnswerRequest request) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new RuntimeException("Question not found"));

        // Score the answer using AnalysisService
        Map<String, Object> analysisResult = analysisService.scoreAnswer(request.getAnswerText(), question);

        int score = (int) analysisResult.get("score");
        List<String> matched = (List<String>) analysisResult.get("keywordsMatched");
        List<String> missed = (List<String>) analysisResult.get("keywordsMissed");
        String feedback = (String) analysisResult.get("feedback");

        // Save the answer
        InterviewAnswer answer = new InterviewAnswer();
        answer.setSessionId(sessionId);
        answer.setUserId(userId);
        answer.setQuestionId(question.getId());
        answer.setQuestionText(question.getQuestionText());
        answer.setAnswerText(request.getAnswerText());
        answer.setScore(score);
        answer.setMaxScore(question.getMaxScore());
        answer.setKeywordsMatched(matched);
        answer.setKeywordsMissed(missed);
        answer.setTimeTakenSeconds(request.getTimeTakenSeconds());

        answerRepository.save(answer);

        // Update session — adaptive difficulty
        session.getAnsweredQuestionIds().add(question.getId());
        session.setCurrentQuestionIndex(session.getCurrentQuestionIndex() + 1);

        double percentage = (double) score / question.getMaxScore() * 100;
        if (percentage >= 70) {
            session.incrementConsecutiveCorrect();
        } else {
            session.incrementConsecutiveWrong();
        }

        if (session.getConsecutiveCorrect() >= 2) {
            session.upgradeDifficulty();
        }
        if (session.getConsecutiveWrong() >= 2) {
            session.downgradeDifficulty();
        }

        boolean isComplete = session.getCurrentQuestionIndex() >= session.getTotalQuestions();
        if (isComplete) {
            session.setStatus("COMPLETED");
            session.setEndedAt(LocalDateTime.now());
        }

        sessionRepository.save(session);

        // Build response
        SubmitAnswerResponse response = new SubmitAnswerResponse();
        response.setScore(score);
        response.setMaxScore(question.getMaxScore());
        response.setKeywordsMatched(matched);
        response.setKeywordsMissed(missed);
        response.setFeedback(feedback);
        response.setNextDifficulty(session.getCurrentDifficulty());
        response.setInterviewComplete(isComplete);
        return response;
    }

    /**
     * End an interview session early
     */
    public void endInterview(String sessionId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));

        session.setStatus("TERMINATED");
        session.setEndedAt(LocalDateTime.now());
        sessionRepository.save(session);
    }

    /**
     * Get session info
     */
    public InterviewSession getSession(String sessionId) {
        return sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Session not found"));
    }

    // --- Helper ---
    private Map<String, Object> buildQuestionMap(Question q, int number, String difficulty) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", q.getId());
        map.put("questionText", q.getQuestionText());
        map.put("questionNumber", number);
        map.put("difficulty", difficulty);
        map.put("timeLimitSeconds", q.getTimeLimitSeconds());
        map.put("maxScore", q.getMaxScore());
        return map;
    }
}
