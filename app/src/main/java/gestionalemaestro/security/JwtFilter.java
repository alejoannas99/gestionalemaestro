package gestionalemaestro.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import gestionalemaestro.model.User;
import gestionalemaestro.store.JpaUserRepository;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final JpaUserRepository userRepository;

    public JwtFilter(JwtUtil jwtUtil, JpaUserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
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
                userRepository.findByEmail(email)
                    .filter(this::puoAccedere)
                    .ifPresent(user -> {
                        UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(
                                user, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    });
            }
        }

        filterChain.doFilter(request, response);
    }

    // Riletto dal database ad ogni richiesta (non dal token): un istruttore disattivato o non
    // ancora approvato perde l'accesso da subito, anche con un token rilasciato prima e ancora
    // valido — non deve aspettare la scadenza (fino a 24 ore) per essere bloccato davvero.
    private boolean puoAccedere(User user) {
        if (user.getRole() != User.Role.INSTRUCTOR) {
            return true;
        }
        return user.isApproved() && user.isEnabled();
    }
}
