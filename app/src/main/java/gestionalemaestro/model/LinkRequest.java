package gestionalemaestro.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

// Richiesta di un account cliente di essere collegato a una scheda di un istruttore.
// L'istruttore la approva scegliendo la scheda giusta, oppure la rifiuta.
@Entity
@Table(name = "link_requests")
public class LinkRequest {

    public enum Status { PENDING, APPROVED, REJECTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // L'account cliente che chiede il collegamento
    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    // L'istruttore a cui è rivolta la richiesta
    @ManyToOne(optional = false)
    @JoinColumn(name = "instructor_id")
    private User instructor;

    // La scheda dell'istruttore che il cliente sostiene di essere. È una sola: nome e cognome sono unici per istruttore.
    @ManyToOne(optional = false)
    @JoinColumn(name = "client_code")
    private Client client;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.PENDING;

    private LocalDateTime createdAt = LocalDateTime.now();

    public LinkRequest() {}

    public LinkRequest(User user, User instructor, Client client) {
        this.user = user;
        this.instructor = instructor;
        this.client = client;
    }

    public Integer getId() { return id; }
    public User getUser() { return user; }
    public User getInstructor() { return instructor; }
    public Client getClient() { return client; }
    public Status getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void approve() { this.status = Status.APPROVED; }
    public void reject() { this.status = Status.REJECTED; }
}
