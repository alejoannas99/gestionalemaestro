package gestionalemaestro.service;

import java.util.List;

import org.springframework.stereotype.Service;

import gestionalemaestro.model.User;
import gestionalemaestro.store.ClientRepository;
import gestionalemaestro.store.JpaUserRepository;
import gestionalemaestro.store.LessonRepository;

// Approvazione delle registrazioni istruttore: nessuno diventa istruttore da solo,
// serve che l'amministratore (l'unico account con l'email in app.admin-email) lo approvi.
// Fa anche da punto unico per i numeri generali dell'app, mostrati nel pannello admin.
@Service
public class AdminService {

    private final JpaUserRepository userRepository;
    private final ClientRepository clientRepository;
    private final LessonRepository lessonRepository;
    private final ErrorLogService errorLogService;

    public AdminService(JpaUserRepository userRepository, ClientRepository clientRepository,
                        LessonRepository lessonRepository, ErrorLogService errorLogService) {
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.lessonRepository = lessonRepository;
        this.errorLogService = errorLogService;
    }

    public List<ErrorLogService.ErrorEntry> erroriRecenti() {
        return errorLogService.recenti();
    }

    public record PendingInstructor(Integer id, String name, String surname, String email) {}

    public record Instructor(Integer id, String name, String surname, String email, boolean enabled) {}

    public record Stato(long istruttoriApprovati, long istruttoriInAttesa,
                        long accountClienti, long schedeClienti, long lezioni) {}

    public Stato stato() {
        return new Stato(
            userRepository.countByRoleAndApprovedTrue(User.Role.INSTRUCTOR),
            userRepository.countByRoleAndApprovedFalse(User.Role.INSTRUCTOR),
            userRepository.countByRole(User.Role.USER),
            clientRepository.findAll().size(),
            lessonRepository.findAll().size()
        );
    }

    public List<PendingInstructor> pendingInstructors() {
        return userRepository.findByRoleAndApprovedFalse(User.Role.INSTRUCTOR).stream()
            .map(u -> new PendingInstructor(u.getId(), u.getName(), u.getSurname(), u.getEmail()))
            .toList();
    }

    public void approve(Integer id) {
        User user = pending(id);
        user.setApproved(true);
        userRepository.save(user);
    }

    public void reject(Integer id) {
        userRepository.delete(pending(id));
    }

    private User pending(Integer id) {
        User user = userRepository.findById(id)
            .filter(u -> u.getRole() == User.Role.INSTRUCTOR && !u.isApproved())
            .orElseThrow(() -> new DomainException("Richiesta non trovata"));
        return user;
    }

    // Istruttori già approvati almeno una volta: attivi e disattivati insieme, distinti dal
    // campo enabled. Non tocca chi è ancora in attesa della prima approvazione (altra lista).
    public List<Instructor> instructors() {
        return userRepository.findByRoleAndApprovedTrue(User.Role.INSTRUCTOR).stream()
            .map(u -> new Instructor(u.getId(), u.getName(), u.getSurname(), u.getEmail(), u.isEnabled()))
            .toList();
    }

    // Toglie l'accesso senza toccare nessun dato suo (clienti, lezioni, storico restano).
    public void disable(Integer id) {
        User user = approvedInstructor(id);
        user.setEnabled(false);
        userRepository.save(user);
    }

    public void enable(Integer id) {
        User user = approvedInstructor(id);
        user.setEnabled(true);
        userRepository.save(user);
    }

    private User approvedInstructor(Integer id) {
        return userRepository.findById(id)
            .filter(u -> u.getRole() == User.Role.INSTRUCTOR && u.isApproved())
            .orElseThrow(() -> new DomainException("Istruttore non trovato"));
    }
}
