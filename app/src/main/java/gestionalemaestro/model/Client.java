package gestionalemaestro.model;

import jakarta.persistence.*;
import java.util.Optional;



@Entity
@Table(name = "clienti")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer code;
    private String name;
    private String surname;
    private String numTel;
    private int lessonsAttended;

    @ManyToOne
    @JoinColumn(name = "instructor_id")
    private Instructor instructor;
    
    
    
    public Client(String name, String surname) {
        this.name = name;
        this.surname = surname;
        this.lessonsAttended = 0;
    }

    public Client() {}

    public void update(String name, String surname){
        this.name=name;
        this.surname=surname;
    }

    public Integer getCode() {
        return code;
    }    
    
    public String getName() {
        return name;
    }
    public String getSurname() {
        return surname;
    }
    public Optional<String> getNumTel() {
        return Optional.ofNullable(numTel);
    }
    
    public void setNumTel(Optional<String> numTel) {
        this.numTel = numTel.orElse(null);
    }

    public int getLessonsAttended() {
        return lessonsAttended;
    }

    public void attendLesson(){
        this.lessonsAttended++;
    }

    public Instructor getInstructor() { 
        return instructor; 
    }
    
    public void setInstructor(Instructor instructor) { 
        this.instructor = instructor; 
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Client)) return false;
        Client that = (Client) o;
        return java.util.Objects.equals(code, that.code);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(code);
    }


}
