package gestionalemaestro.model;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;



@Entity
@Table(name = "clienti")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer code;
    private String name;
    private String surname;
    private String numTel;
    // Colonna storica: non più usata (le lezioni svolte si calcolano dalle lezioni). Resta mappata perché nel
    // database è NOT NULL; si può togliere con: ALTER TABLE clienti DROP COLUMN lessons_attended;
    private int lessonsAttended;

    @ManyToOne
    @JoinColumn(name = "instructor_id")
    private User instructor;

    // Account (User) che possono vedere questa scheda: il collegamento avviene per approvazione dell'istruttore.
    // EAGER perché l'insieme è piccolo e, con open-in-view disattivato, un caricamento lazy fuori transazione darebbe errore.
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
        name = "client_account",
        joinColumns = @JoinColumn(name = "client_code"),
        inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> accounts = new HashSet<>();


    public Client(String name, String surname) {
        this.name = NameUtil.normalize(name);
        this.surname = NameUtil.normalize(surname);
        this.lessonsAttended = 0;
    }

    public Client() {}

    public void update(String name, String surname){
        this.name=NameUtil.normalize(name);
        this.surname=NameUtil.normalize(surname);
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

    public Set<User> getAccounts() {
        return accounts;
    }

    public void linkAccount(User user) {
        this.accounts.add(user);
    }

    public User getInstructor() {
        return instructor; 
    }
    
    public void setInstructor(User instructor) { 
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
