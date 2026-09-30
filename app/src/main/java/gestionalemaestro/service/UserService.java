package gestionalemaestro.service;

import gestionalemaestro.model.User;
import gestionalemaestro.store.JpaUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final JpaUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;

    public UserService(JpaUserRepository userRepository, PasswordEncoder passwordEncoder,
                       @Value("${app.admin-email}") String adminEmail) {
        this.userRepository  = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail      = adminEmail;
    }

    public User register(String email, String password, String name, String surname, User.Role role) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new DomainException("Email già registrata");
        }
        User user = new User(email, passwordEncoder.encode(password), name, surname, role);
        // L'amministratore si auto-approva: altrimenti nessuno potrebbe mai approvare il primo
        // account istruttore, dato che solo un istruttore già approvato può accedere alla pagina admin.
        if (role == User.Role.INSTRUCTOR) {
            user.setApproved(adminEmail.equalsIgnoreCase(email));
        }
        return userRepository.save(user);
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new DomainException("Utente non trovato"));
    }
}
