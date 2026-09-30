package gestionalemaestro.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.model.User;
import gestionalemaestro.security.JwtUtil;
import gestionalemaestro.service.DomainException;
import gestionalemaestro.service.UserService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserService userService, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        return registerWithRole(request, User.Role.USER, "Registrazione effettuata");
    }

    @PostMapping("/register/instructor")
    public ResponseEntity<String> registerInstructor(@RequestBody RegisterRequest request) {
        return registerWithRole(request, User.Role.INSTRUCTOR, "Istruttore registrato");
    }

    private ResponseEntity<String> registerWithRole(RegisterRequest request, User.Role role, String okMessage) {
        try {
            userService.register(request.email(), request.password(),
                                 request.name(), request.surname(), role);
            return ResponseEntity.status(201).body(okMessage);
        } catch (DomainException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequest request) {
        // Stesso codice e stesso messaggio sia se l'email non esiste sia se la password è
        // sbagliata: altrimenti chi prova il login può scoprire quali email sono registrate.
        try {
            User user = userService.findByEmail(request.email());
            if (!passwordEncoder.matches(request.password(), user.getPassword())) {
                return ResponseEntity.status(401).body("Email o password non validi");
            }
            if (user.getRole() == User.Role.INSTRUCTOR && !user.isApproved()) {
                return ResponseEntity.status(403).body("Account in attesa di approvazione");
            }
            if (user.getRole() == User.Role.INSTRUCTOR && !user.isEnabled()) {
                return ResponseEntity.status(403).body("Account disattivato dall'amministratore");
            }
            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
            return ResponseEntity.ok(token);
        } catch (DomainException e) {
            return ResponseEntity.status(401).body("Email o password non validi");
        }
    }

    record RegisterRequest(String email, String password, String name, String surname) {}
    record LoginRequest(String email, String password) {}
}