package com.interviewer.repository;

import com.interviewer.model.InterviewReport;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;
import java.util.List;

public interface ReportRepository extends MongoRepository<InterviewReport, String> {
    Optional<InterviewReport> findBySessionId(String sessionId);
    List<InterviewReport> findByUserId(String userId);
}
