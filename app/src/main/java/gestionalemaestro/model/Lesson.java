package gestionalemaestro.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class Lesson {

    private int id;
    private List<Client> clients = new ArrayList<>();
    private LocalDate date;
    private LocalTime start;
    private LocalTime finish;
    
    
    
    
    public Lesson(Integer id, LocalDate date, LocalTime start, LocalTime finish, List<Client> clients) {
        this.id = id;
        this.date = date;
        this.start = start;
        this.finish = finish;
        this.clients = clients;        
    }

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
