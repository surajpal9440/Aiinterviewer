package com.interviewer.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints — no JWT needed
                .requestMatchers("/api/auth/**").permitAll()
                // Allow error page (prevents 500 when Spring forwards to /error)
                .requestMatchers("/error").permitAll()
                // Allow ALL static resources
                .requestMatchers(
                    "/", "/index.html", "/dashboard.html",
                    "/interview.html", "/report.html",
                    "/css/**", "/js/**", "/images/**",
                    "/models/**",
                    "/*.html", "/*.css", "/*.js",
                    "/*.json", "/*.png", "/*.jpg",
                    "/*.ico", "/*.woff", "/*.woff2"
                ).permitAll()
                // All other API endpoints need JWT
                .requestMatchers("/api/**").authenticated()
                // Default: permit
                .anyRequest().permitAll()
            )
            // Disable default login page
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            // Add custom error handling
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setContentType("application/json");
                    response.setStatus(401);
                    response.getWriter().write("{\"error\": \"Unauthorized. Please login.\"}");
                })
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
