package com.interviewer.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.interviewer.model.Question;
import com.interviewer.repository.QuestionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.InputStream;
import java.util.List;

/**
 * Loads questions from questions.json into MongoDB on application startup.
 * Only loads if the question collection is empty.
 */
@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private QuestionRepository questionRepository;

    @Override
    public void run(String... args) throws Exception {
        if (questionRepository.count() == 0) {
            System.out.println("📚 Loading question bank into MongoDB...");

            ObjectMapper mapper = new ObjectMapper();

            // Try classpath first, then file system
            InputStream inputStream;
            try {
                inputStream = new ClassPathResource("data/questions.json").getInputStream();
            } catch (Exception e) {
                // Try from project root
                File file = new File("src/main/resources/data/questions.json");
                if (file.exists()) {
                    inputStream = new java.io.FileInputStream(file);
                } else {
                    System.out.println("⚠️ questions.json not found. Skipping data load.");
                    return;
                }
            }

            List<Question> questions = mapper.readValue(inputStream, new TypeReference<List<Question>>() {});
            questionRepository.saveAll(questions);
            System.out.println("✅ Loaded " + questions.size() + " questions successfully!");
        } else {
            System.out.println("📚 Question bank already loaded (" + questionRepository.count() + " questions).");
        }
    }
}
