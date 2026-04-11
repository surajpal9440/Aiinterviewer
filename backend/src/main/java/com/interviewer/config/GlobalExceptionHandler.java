package com.interviewer.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler to catch any unhandled exceptions
 * and return proper JSON error responses instead of 500 HTML pages.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleAllExceptions(Exception e) {
        logger.error("Unhandled exception caught by GlobalExceptionHandler: ", e);

        Map<String, String> error = new HashMap<>();
        error.put("error", e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        error.put("type", e.getClass().getSimpleName());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
