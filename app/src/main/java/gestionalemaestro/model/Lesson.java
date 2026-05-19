package gestionalemaestro.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Entity
@Table(name = "lezioni")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "lezione_cliente",
        joinColumns = @JoinColumn(name = "lezione_id"),
        inverseJoinColumns = @JoinColumn(name = "cliente_code")
    )
    private List<Client> clients = new ArrayList<>();

    private LocalDate date;
    private LocalTime start;
    private LocalTime finish;

    @ManyToOne
    @JoinColumn(name = "instructor_id")
    private Instructor instructor;

    public Lesson(LocalDate date, LocalTime start, LocalTime finish, List<Client> clients) {
        this.date = date;
        this.start = start;
        this.finish = finish;
        this.clients = clients;
    }

    public Lesson() {}

    // Getter
    public Integer getId() { return id; }
    public List<Client> getClients() { return clients; }
    public LocalTime getStart() { return start; }
    public LocalTime getFinish() { return finish; }
    public LocalDate getDate() { return date; }
    public Instructor getInstructor() { return instructor; }

    // Setter
    public void setInstructor(Instructor instructor) { this.instructor = instructor; }
    public void setDate(LocalDate date) { this.date = date; }
    public void setStart(LocalTime start) { this.start = start; }
    public void setFinish(LocalTime finish) { this.finish = finish; }
    public void setClients(List<Client> clients) { this.clients = clients; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Lesson)) return false;
        Lesson that = (Lesson) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
