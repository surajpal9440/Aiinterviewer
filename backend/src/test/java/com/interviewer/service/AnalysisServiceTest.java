package com.interviewer.service;

import com.interviewer.model.Question;
import com.interviewer.strategy.HybridAnalysisStrategy;
import com.interviewer.strategy.KeywordAnalysisStrategy;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class AnalysisServiceTest {

    private final KeywordAnalysisStrategy keywordStrategy = new KeywordAnalysisStrategy();
    private final HybridAnalysisStrategy hybridStrategy = new HybridAnalysisStrategy();

    private Question createTestQuestion() {
        Question q = new Question();
        q.setExpectedKeywords(Arrays.asList("polymorphism", "overriding", "overloading", "runtime", "method"));
        q.setMaxScore(10);
        q.setTimeLimitSeconds(120);
        return q;
    }

    @Test
    @DisplayName("Keyword Strategy: All keywords present should give full score")
    void testKeywordMatching_AllKeywordsPresent() {
        Question q = createTestQuestion();
        String answer = "Polymorphism allows method overriding and overloading at runtime";

        Map<String, Object> result = keywordStrategy.analyze(answer, q);
        int score = (int) result.get("score");

        assertEquals(10, score, "Should get full score when all keywords match");
    }

    @Test
    @DisplayName("Keyword Strategy: No keywords present should give zero")
    void testKeywordMatching_NoKeywordsPresent() {
        Question q = createTestQuestion();
        String answer = "I don't know the answer to this question";

        Map<String, Object> result = keywordStrategy.analyze(answer, q);
        int score = (int) result.get("score");

        assertEquals(0, score, "Should get 0 when no keywords match");
    }

    @Test
    @DisplayName("Keyword Strategy: Partial match should give partial score")
    void testKeywordMatching_PartialMatch() {
        Question q = createTestQuestion();
        String answer = "Polymorphism means having many forms using method overriding";

        Map<String, Object> result = keywordStrategy.analyze(answer, q);
        int score = (int) result.get("score");
        List<String> matched = (List<String>) result.get("keywordsMatched");
        List<String> missed = (List<String>) result.get("keywordsMissed");

        assertTrue(score > 0 && score < 10, "Partial match should give partial score");
        assertFalse(matched.isEmpty(), "Should have matched keywords");
        assertFalse(missed.isEmpty(), "Should have missed keywords");
    }

    @Test
    @DisplayName("Keyword Strategy: Case insensitive matching")
    void testKeywordMatching_CaseInsensitive() {
        Question q = createTestQuestion();
        String answer = "POLYMORPHISM is about OVERRIDING and OVERLOADING METHODS at RUNTIME";

        Map<String, Object> result = keywordStrategy.analyze(answer, q);
        int score = (int) result.get("score");

        assertEquals(10, score, "Should match keywords case-insensitively");
    }

    @Test
    @DisplayName("Hybrid Strategy: Longer answers should score higher")
    void testHybridStrategy_LongerAnswer() {
        Question q = createTestQuestion();
        String shortAnswer = "Polymorphism means overriding";
        String longAnswer = "Polymorphism is a key concept in object oriented programming that allows " +
                "method overriding where a child class provides its own implementation and method overloading " +
                "where the same method name is used with different parameters at runtime the method dispatch " +
                "mechanism determines which method to call based on the actual object type";

        Map<String, Object> shortResult = hybridStrategy.analyze(shortAnswer, q);
        Map<String, Object> longResult = hybridStrategy.analyze(longAnswer, q);

        int shortScore = (int) shortResult.get("score");
        int longScore = (int) longResult.get("score");

        assertTrue(longScore >= shortScore, "Longer, more detailed answer should score equal or higher");
    }

    @Test
    @DisplayName("Keyword Strategy: Empty answer should give zero")
    void testKeywordMatching_EmptyAnswer() {
        Question q = createTestQuestion();
        String answer = "";

        Map<String, Object> result = keywordStrategy.analyze(answer, q);
        int score = (int) result.get("score");

        assertEquals(0, score, "Empty answer should get 0");
    }
}
