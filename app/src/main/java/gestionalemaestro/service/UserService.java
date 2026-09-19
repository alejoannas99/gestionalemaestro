package gestionalemaestro.service;

import gestionalemaestro.model.User;
import gestionalemaestro.store.JpaUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final JpaUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(JpaUserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User register(String email, String password, String name, String surname, User.Role role) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new DomainException("Email già registrata");
        }
        User user = new User(email, passwordEncoder.encode(password), name, surname, role);
        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new DomainException("Utente non trovato"));
    }
}
