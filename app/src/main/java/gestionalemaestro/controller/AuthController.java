package gestionalemaestro.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.model.Instructor;
import gestionalemaestro.security.JwtUtil;
import gestionalemaestro.service.DomainException;
import gestionalemaestro.service.InstructorService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final InstructorService instructorService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(InstructorService instructorService, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.instructorService = instructorService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        try {
            instructorService.register(
                request.email(),
                request.password(),
                request.name(),
                request.surname()
            );
            return ResponseEntity.status(201).body("Instructor registrato");
        } catch (DomainException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        try {
            Instructor instructor = instructorService.findByEmail(request.email());
            if (!passwordEncoder.matches(request.password(), instructor.getPassword())) {
                return ResponseEntity.status(401).body("Password errata");
            }
            String token = jwtUtil.generateToken(request.email());
            return ResponseEntity.ok(token);
        } catch (DomainException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    record RegisterRequest(String email, String password, String name, String surname) {}
    record LoginRequest(String email, String password) {}
}