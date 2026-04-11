package com.interviewer.strategy;

import com.interviewer.model.Question;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Hybrid Analysis Strategy.
 * Combines keyword matching (60%), answer length (20%), and relevance (20%).
 */
@Component("hybrid")
public class HybridAnalysisStrategy implements AnalysisStrategy {

    @Override
    public Map<String, Object> analyze(String userAnswer, Question question) {
        String answerLower = userAnswer.toLowerCase().trim();
        List<String> expected = question.getExpectedKeywords();

        // --- Keyword matching ---
        List<String> matched = expected.stream()
                .filter(keyword -> answerLower.contains(keyword.toLowerCase()))
                .collect(Collectors.toList());

        List<String> missed = expected.stream()
                .filter(keyword -> !answerLower.contains(keyword.toLowerCase()))
                .collect(Collectors.toList());

        double keywordRatio = expected.isEmpty() ? 0 : (double) matched.size() / expected.size();
        double keywordScore = keywordRatio * question.getMaxScore() * 0.6;

        // --- Length score (20%) ---
        int wordCount = userAnswer.trim().split("\\s+").length;
        int expectedMinWords = 20;
        double lengthRatio = Math.min(1.0, (double) wordCount / expectedMinWords);
        double lengthScore = lengthRatio * question.getMaxScore() * 0.2;

        // --- Relevance score (20%) ---
        // Check if the answer contains the main topic from the question
        double relevanceScore = 0;
        if (!expected.isEmpty()) {
            String mainKeyword = expected.get(0); // First keyword = main topic
            if (answerLower.contains(mainKeyword.toLowerCase())) {
                relevanceScore = question.getMaxScore() * 0.2;
            }
        }

        int totalScore = (int) Math.round(keywordScore + lengthScore + relevanceScore);
        totalScore = Math.min(totalScore, question.getMaxScore()); // Cap at max

        Map<String, Object> result = new HashMap<>();
        result.put("score", totalScore);
        result.put("keywordsMatched", matched);
        result.put("keywordsMissed", missed);
        return result;
    }
}
