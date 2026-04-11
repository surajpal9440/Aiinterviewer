package com.interviewer.repository;

import com.interviewer.model.InterviewAnswer;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface AnswerRepository extends MongoRepository<InterviewAnswer, String> {
    List<InterviewAnswer> findBySessionId(String sessionId);
    List<InterviewAnswer> findByUserId(String userId);
}
