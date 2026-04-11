package com.interviewer.service;

import com.interviewer.model.Question;
import com.interviewer.strategy.AnalysisStrategy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * AnalysisService — uses Strategy pattern to score answers.
 * The @Qualifier selects which analysis algorithm to use.
 */
@Service
public class AnalysisService {

    @Autowired
    @Qualifier("hybrid")  // Switch to "keyword" for simpler analysis
    private AnalysisStrategy strategy;

    /**
     * Score a user's answer against the expected answer
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> scoreAnswer(String userAnswer, Question question) {
        Map<String, Object> result = strategy.analyze(userAnswer, question);

        // Add feedback based on score
        int score = (int) result.get("score");
        int maxScore = question.getMaxScore();
        double percentage = (double) score / maxScore * 100;

        String feedback;
        if (percentage >= 80) {
            feedback = "Excellent answer! You covered the key concepts well.";
        } else if (percentage >= 60) {
            feedback = "Good answer, but you missed some important points.";
        } else if (percentage >= 40) {
            feedback = "Average answer. Try to include more technical details.";
        } else if (percentage > 0) {
            feedback = "Your answer needs improvement. Review the key concepts.";
        } else {
            feedback = "Your answer didn't match the expected response. Study this topic.";
        }

        result.put("feedback", feedback);
        result.put("maxScore", maxScore);
        return result;
    }

    /**
     * Calculate communication score based on answer quality
     */
    public int calculateCommunicationScore(String answer) {
        if (answer == null || answer.trim().isEmpty()) return 0;

        int wordCount = answer.trim().split("\\s+").length;
        int sentenceCount = answer.split("[.!?]+").length;

        // Score based on word count (well-structured answers are longer)
        int lengthScore;
        if (wordCount >= 50) lengthScore = 40;
        else if (wordCount >= 30) lengthScore = 30;
        else if (wordCount >= 15) lengthScore = 20;
        else lengthScore = 10;

        // Score based on sentence structure
        int structureScore;
        if (sentenceCount >= 3) structureScore = 30;
        else if (sentenceCount >= 2) structureScore = 20;
        else structureScore = 10;

        // Score based on vocabulary diversity
        String[] words = answer.toLowerCase().split("\\s+");
        long uniqueWords = java.util.Arrays.stream(words).distinct().count();
        double diversityRatio = (double) uniqueWords / words.length;

        int diversityScore;
        if (diversityRatio >= 0.7) diversityScore = 30;
        else if (diversityRatio >= 0.5) diversityScore = 20;
        else diversityScore = 10;

        return Math.min(100, lengthScore + structureScore + diversityScore);
    }

    /**
     * Calculate confidence score based on response time and answer completeness
     */
    public int calculateConfidenceScore(int timeTakenSeconds, int timeLimitSeconds, String answer) {
        if (answer == null || answer.trim().isEmpty()) return 0;

        // Time factor — faster (but not too fast) = more confident
        double timeRatio = (double) timeTakenSeconds / timeLimitSeconds;
        int timeScore;
        if (timeRatio <= 0.1) timeScore = 20;       // Too fast = possibly guessing
        else if (timeRatio <= 0.5) timeScore = 40;   // Quick and confident
        else if (timeRatio <= 0.75) timeScore = 35;   // Good pace
        else if (timeRatio <= 1.0) timeScore = 25;    // Used most of the time
        else timeScore = 15;                          // Over time

        // Completeness — longer answers = more confident
        int wordCount = answer.trim().split("\\s+").length;
        int completenessScore;
        if (wordCount >= 40) completenessScore = 40;
        else if (wordCount >= 20) completenessScore = 30;
        else if (wordCount >= 10) completenessScore = 20;
        else completenessScore = 10;

        // Filler word penalty (um, uh, like, you know)
        String lower = answer.toLowerCase();
        int fillerCount = 0;
        String[] fillers = {"um ", "uh ", "like ", "you know", "basically", "actually"};
        for (String filler : fillers) {
            if (lower.contains(filler)) fillerCount++;
        }
        int fillerPenalty = fillerCount * 5;

        return Math.max(0, Math.min(100, timeScore + completenessScore + 20 - fillerPenalty));
    }
}
