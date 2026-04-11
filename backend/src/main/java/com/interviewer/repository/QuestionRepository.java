package com.interviewer.repository;

import com.interviewer.model.Question;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface QuestionRepository extends MongoRepository<Question, String> {
    List<Question> findByRoleCategoryAndDifficulty(String roleCategory, String difficulty);
    List<Question> findByRoleCategory(String roleCategory);
    long countByRoleCategoryAndDifficulty(String roleCategory, String difficulty);
}
