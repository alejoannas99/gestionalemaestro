package gestionalemaestro.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.Lesson;
import gestionalemaestro.model.LinkRequest;
import gestionalemaestro.model.User;
import gestionalemaestro.store.ClientRepository;
import gestionalemaestro.store.JpaLinkRequestRepository;
import gestionalemaestro.store.JpaUserRepository;
import gestionalemaestro.store.LessonRepository;

// Collegamento tra un account cliente (User) e le sue schede presso gli istruttori.
// Il cliente chiede, l'istruttore che conosce la persona approva.
@Service
public class LinkService {

    private final JpaLinkRequestRepository requestRepository;
    private final JpaUserRepository userRepository;
    private final ClientRepository clientRepository;
    private final LessonRepository lessonRepository;

    public LinkService(JpaLinkRequestRepository requestRepository, JpaUserRepository userRepository,
                       ClientRepository clientRepository, LessonRepository lessonRepository) {
        this.requestRepository = requestRepository;
        this.userRepository = userRepository;
        this.clientRepository = clientRepository;
        this.lessonRepository = lessonRepository;
    }

    public record InstructorInfo(Integer id, String name, String surname) {}
    public record MyRequest(Integer id, String instructorName, String instructorSurname, String status) {}
    // Cosa vede l'istruttore per riconoscere chi chiede: email oscurata, ore fatte insieme e periodo
    public record PendingRequest(Integer id, String name, String surname, String maskedEmail,
                                 int lessons, double hours, LocalDate from, LocalDate to) {}

    public List<InstructorInfo> instructors() {
        return userRepository.findByRole(User.Role.INSTRUCTOR).stream()
            .map(i -> new InstructorInfo(i.getId(), i.getName(), i.getSurname()))
            .toList();
    }

    // Il cliente dice "ho fatto lezione con questo istruttore": si cerca la scheda con il suo nome tra quelle dell'istruttore
    public void request(User user, Integer instructorId) {
        User instructor = userRepository.findById(instructorId)
            .filter(u -> u.getRole() == User.Role.INSTRUCTOR)
            .orElseThrow(() -> new DomainException("Istruttore non trovato"));

        Client client = clientRepository.findByFullName(user.getName(), user.getSurname()).stream()
            .filter(c -> instructor.equals(c.getInstructor()))
            .findFirst()
            .orElseThrow(() -> new DomainException("Non abbiamo trovato lezioni a tuo nome con questo istruttore"));

        if (client.getAccounts().contains(user)) {
            throw new DomainException("Sei già collegato a questo istruttore");
        }
        if (requestRepository.existsByUserAndClientAndStatus(user, client, LinkRequest.Status.PENDING)) {
            throw new DomainException("Hai già inviato una richiesta a questo istruttore");
        }
        requestRepository.save(new LinkRequest(user, instructor, client));
    }

    public List<MyRequest> myRequests(User user) {
        return requestRepository.findByUser(user).stream()
            .map(r -> new MyRequest(r.getId(), r.getInstructor().getName(), r.getInstructor().getSurname(), r.getStatus().name()))
            .toList();
    }

    public List<PendingRequest> pendingFor(User instructor) {
        LocalDateTime now = LocalDateTime.now();
        return requestRepository.findByInstructorAndStatus(instructor, LinkRequest.Status.PENDING).stream()
            .map(r -> {
                List<Lesson> done = lessonRepository.findByInstructor(instructor).stream()
                    .filter(l -> l.getClients().contains(r.getClient()))
                    .filter(l -> LocalDateTime.of(l.getDate(), l.getFinish()).isBefore(now))
                    .toList();
                return new PendingRequest(
                    r.getId(),
                    r.getClient().getName(),
                    r.getClient().getSurname(),
                    mask(r.getUser().getEmail()),
                    done.size(),
                    done.stream().mapToDouble(Lesson::getDurationInHours).sum(),
                    done.stream().map(Lesson::getDate).min(Comparator.naturalOrder()).orElse(null),
                    done.stream().map(Lesson::getDate).max(Comparator.naturalOrder()).orElse(null));
            })
            .toList();
    }

    public void approve(User instructor, Integer requestId) {
        LinkRequest r = ownPending(instructor, requestId);
        Client client = r.getClient();
        client.linkAccount(r.getUser());
        clientRepository.save(client);
        r.approve();
        requestRepository.save(r);
    }

    public void reject(User instructor, Integer requestId) {
        LinkRequest r = ownPending(instructor, requestId);
        r.reject();
        requestRepository.save(r);
    }

    // Una richiesta si può decidere solo se è dell'istruttore che la decide ed è ancora in attesa
    private LinkRequest ownPending(User instructor, Integer requestId) {
        LinkRequest r = requestRepository.findById(requestId).orElse(null);
        if (r == null || !instructor.equals(r.getInstructor()) || r.getStatus() != LinkRequest.Status.PENDING) {
            throw new DomainException("Richiesta non trovata");
        }
        return r;
    }

    // luca.bianchi@gmail.com -> l***@gmail.com
    static String mask(String email) {
        int at = email.indexOf('@');
        return at <= 0 ? "***" : email.charAt(0) + "***" + email.substring(at);
    }
}
