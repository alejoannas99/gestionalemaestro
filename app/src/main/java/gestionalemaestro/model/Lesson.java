package gestionalemaestro.model;

import java. time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class Lesson {

    private int id;
    private List<Client> clients = new ArrayList<>();
    private LocalDate date;
    private String start;
    private String finish;
    
    
    
    
    public Lesson(Integer id, String date, String start, String finish, List<Client> clients) {
        this.id = id;
        this.date = LocalDate.parse(date);
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
    public String getStart() {
        return start;
    }
    public String getFinish() {
        return finish;
    }

    public LocalDate getDate() {
        return date;
    }


}
