package com.interviewer.strategy;

import com.interviewer.model.Question;
import java.util.List;
import java.util.Map;

/**
 * Strategy Pattern Interface — defines the contract for answer analysis.
 * Different strategies can be swapped without changing the service code.
 */
public interface AnalysisStrategy {

    /**
     * Analyze a user's answer against the expected question.
     * @return a result map containing: score, keywordsMatched, keywordsMissed
     */
    Map<String, Object> analyze(String userAnswer, Question question);
}
