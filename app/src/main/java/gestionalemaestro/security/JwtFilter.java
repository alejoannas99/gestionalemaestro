package gestionalemaestro.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import gestionalemaestro.store.JpaInstructorRepository;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final JpaInstructorRepository instructorRepository;

    public JwtFilter(JwtUtil jwtUtil, JpaInstructorRepository instructorRepository) {
        this.jwtUtil = jwtUtil;
        this.instructorRepository = instructorRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (jwtUtil.isValid(token)) {
                String email = jwtUtil.extractEmail(token);
                instructorRepository.findByEmail(email).ifPresent(instructor -> {
                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(instructor, null, List.of());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                });
            }
        }

        filterChain.doFilter(request, response);
    }
}
