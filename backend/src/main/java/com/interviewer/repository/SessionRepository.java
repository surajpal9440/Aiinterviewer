package com.interviewer.repository;

import com.interviewer.model.InterviewSession;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SessionRepository extends MongoRepository<InterviewSession, String> {
    List<InterviewSession> findByUserId(String userId);
    List<InterviewSession> findByUserIdAndStatus(String userId, String status);
}
