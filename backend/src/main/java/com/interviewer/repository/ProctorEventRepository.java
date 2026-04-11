package com.interviewer.repository;

import com.interviewer.model.ProctorEvent;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ProctorEventRepository extends MongoRepository<ProctorEvent, String> {
    List<ProctorEvent> findBySessionId(String sessionId);
    long countBySessionIdAndEventType(String sessionId, String eventType);
}
