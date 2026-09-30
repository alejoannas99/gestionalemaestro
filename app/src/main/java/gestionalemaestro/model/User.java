package gestionalemaestro.model;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User {

    public enum Role { INSTRUCTOR, USER }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    private String name;
    private String surname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // Un istruttore appena registrato parte non approvato e non può fare login finché
    // l'amministratore non lo approva a mano. Un cliente (USER) è sempre approvato.
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean approved = true;

    // Diverso da approved: un istruttore già approvato che l'amministratore disattiva in un
    // secondo momento (senza cancellare nulla). Un account non approvato ha enabled=true ma
    // resta comunque bloccato da approved=false finché non viene approvato la prima volta.
    @Column(nullable = false, columnDefinition = "boolean default true")
    private boolean enabled = true;

    public User() {}

    public User(String email, String password, String name, String surname, Role role) {
        this.email    = email;
        this.password = password;
        this.name     = NameUtil.normalize(name);
        this.surname  = NameUtil.normalize(surname);
        this.role     = role;
    }

    public Integer getId()       { return id; }
    public String getEmail()     { return email; }
    public String getPassword()  { return password; }
    public String getName()      { return name; }
    public String getSurname()   { return surname; }
    public Role getRole()        { return role; }
    public boolean isApproved()  { return approved; }
    public boolean isEnabled()   { return enabled; }
    public void setPassword(String password) { this.password = password; }
    public void setApproved(boolean approved) { this.approved = approved; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof User)) return false;
        User that = (User) o;
        return java.util.Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return java.util.Objects.hash(id);
    }
}
