package com.interviewer.factory;

import com.interviewer.model.Question;
import com.interviewer.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Factory Pattern — creates question sets based on role and difficulty.
 * Encapsulates the selection logic away from the controller/service.
 */
@Component
public class QuestionFactory {

    @Autowired
    private QuestionRepository questionRepository;

    /**
     * Get a filtered, shuffled question for a given role + difficulty,
     * excluding already-answered questions.
     */
    public Question getNextQuestion(String roleCategory, String difficulty, List<String> excludeIds) {
        List<Question> questions = questionRepository
                .findByRoleCategoryAndDifficulty(roleCategory, difficulty);

        // Filter out already-answered questions
        List<Question> available = questions.stream()
                .filter(q -> !excludeIds.contains(q.getId()))
                .collect(Collectors.toList());

        if (available.isEmpty()) {
            // If no questions at this difficulty, try any difficulty
            questions = questionRepository.findByRoleCategory(roleCategory);
            available = questions.stream()
                    .filter(q -> !excludeIds.contains(q.getId()))
                    .collect(Collectors.toList());
        }

        if (available.isEmpty()) {
            return null; // No more questions available
        }

        // Shuffle and pick one
        Collections.shuffle(available);
        return available.get(0);
    }
}
