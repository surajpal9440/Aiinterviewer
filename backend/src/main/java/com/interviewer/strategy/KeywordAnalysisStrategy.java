package com.interviewer.strategy;

import com.interviewer.model.Question;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Keyword-based Analysis Strategy.
 * Scores answers based purely on how many expected keywords are present.
 */
@Component("keyword")
public class KeywordAnalysisStrategy implements AnalysisStrategy {

    @Override
    public Map<String, Object> analyze(String userAnswer, Question question) {
        String answerLower = userAnswer.toLowerCase().trim();
        List<String> expected = question.getExpectedKeywords();

        List<String> matched = expected.stream()
                .filter(keyword -> answerLower.contains(keyword.toLowerCase()))
                .collect(Collectors.toList());

        List<String> missed = expected.stream()
                .filter(keyword -> !answerLower.contains(keyword.toLowerCase()))
                .collect(Collectors.toList());

        double ratio = expected.isEmpty() ? 0 : (double) matched.size() / expected.size();
        int score = (int) Math.round(ratio * question.getMaxScore());

        Map<String, Object> result = new HashMap<>();
        result.put("score", score);
        result.put("keywordsMatched", matched);
        result.put("keywordsMissed", missed);
        return result;
    }
}
