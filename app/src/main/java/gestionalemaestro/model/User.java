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

    public User() {}

    public User(String email, String password, String name, String surname, Role role) {
        this.email    = email;
        this.password = password;
        this.name     = name;
        this.surname  = surname;
        this.role     = role;
    }

    public Integer getId()       { return id; }
    public String getEmail()     { return email; }
    public String getPassword()  { return password; }
    public String getName()      { return name; }
    public String getSurname()   { return surname; }
    public Role getRole()        { return role; }
    public void setPassword(String password) { this.password = password; }

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
