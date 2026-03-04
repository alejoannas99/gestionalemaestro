package gestionalemaestro.model;

import java.util.Optional;

public class Client {

    private String code;
    private String name;
    private String surname;
    private Optional<String> numTel = Optional.empty();
    private int lessonsAttended;
    
    
    
    public Client(String code, String name, String surname) {
        this.code = code;
        this.name = name;
        this.surname = surname;
        this.lessonsAttended = 0;
    }

    public void update(String name, String surname){
        this.name=name;
        this.surname=surname;
    }

    public String getCode() {
        return code;
    }    
    
    public String getName() {
        return name;
    }
    public String getSurname() {
        return surname;
    }
    public Optional<String> getNumTel() {
        return numTel;
    }
    public void setNumTel(String numTel){
        this.numTel=Optional.of(numTel);
    }

    public int getLessonsAttended() {
        return lessonsAttended;
    }

    public void attendLesson(){
        this.lessonsAttended++;
    }



}
