package com.interviewer.service;

import com.interviewer.config.JwtUtil;
import com.interviewer.dto.AuthResponse;
import com.interviewer.dto.LoginRequest;
import com.interviewer.dto.RegisterRequest;
import com.interviewer.model.User;
import com.interviewer.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * Register a new user
     */
    public AuthResponse register(RegisterRequest request) {
        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already taken");
        }

        // Create user with hashed password
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());

        User savedUser = userRepository.save(user);

        // Generate JWT
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getUsername());

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUsername(savedUser.getUsername());
        response.setFullName(savedUser.getFullName());
        response.setUserId(savedUser.getId());
        response.setMessage("Registration successful");
        return response;
    }

    /**
     * Login user
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId(), user.getUsername());

        AuthResponse response = new AuthResponse();
        response.setToken(token);
        response.setUsername(user.getUsername());
        response.setFullName(user.getFullName());
        response.setUserId(user.getId());
        response.setMessage("Login successful");
        return response;
    }
}
