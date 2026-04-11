package com.interviewer.config;

import com.interviewer.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);

            try {
                if (jwtUtil.validateToken(token)) {
                    String userId = jwtUtil.getUserIdFromToken(token);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userId, null, new ArrayList<>());

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (Exception e) {
                // Invalid token — just continue without auth
                logger.debug("Invalid JWT token: " + e.getMessage());
            }
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Skip JWT filter for static resources and auth endpoints
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/") ||
               path.equals("/error") ||
               path.endsWith(".html") ||
               path.endsWith(".css") ||
               path.endsWith(".js") ||
               path.endsWith(".json") ||
               path.endsWith(".png") ||
               path.endsWith(".jpg") ||
               path.endsWith(".ico") ||
               path.endsWith(".woff") ||
               path.endsWith(".woff2") ||
               path.startsWith("/api/auth/");
    }
}
