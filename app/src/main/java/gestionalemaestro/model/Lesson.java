package gestionalemaestro.model;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;


@Entity
@Table(name = "lezioni")
public class Lesson {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int id;
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
    
    
    
    
    public Lesson(LocalDate date, LocalTime start, LocalTime finish, List<Client> clients) {
        this.date = date;
        this.start = start;
        this.finish = finish;
        this.clients = clients;        
    }

    public Lesson() {}

    public int getId() {
        return id;
    }   
    
    public List<Client> getClients() {
        return clients;
    }
    public LocalTime getStart() {
        return start;
    }
    public LocalTime getFinish() {
        return finish;
    }

    public LocalDate getDate() {
        return date;
    }


}
