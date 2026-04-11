package com.interviewer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AiInterviewerApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiInterviewerApplication.class, args);
        System.out.println("============================================");
        System.out.println("  AI Interview Simulator is RUNNING!");
        System.out.println("  Open: http://localhost:8080");
        System.out.println("============================================");
    }
}
