package gestionalemaestro.model;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.*;

// Impostazioni di un utente. Oggi: località predefinita e, per gli istruttori, cosa insegnano.
@Entity
@Table(name = "user_settings")
public class UserSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    // Dove l'istruttore di solito fa lezione (null = non impostata)
    @Embedded
    private Location defaultLocation;

    // Se vero, ogni lezione usa sempre la località predefinita e il campo non si mostra nel form
    private boolean fixedLocation;

    // Cosa insegna: solo per gli istruttori, vuoto per i clienti. Tabella a parte creata da Hibernate
    // (user_settings_disciplines), una riga per ogni disciplina scelta.
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_settings_disciplines", joinColumns = @JoinColumn(name = "user_settings_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "discipline")
    private Set<Discipline> disciplines = new HashSet<>();

    protected UserSettings() {}

    public UserSettings(User user) {
        this.user = user;
    }

    public Integer getId() { return id; }
    public User getUser() { return user; }
    public Location getDefaultLocation() { return defaultLocation; }
    public boolean isFixedLocation() { return fixedLocation; }
    public Set<Discipline> getDisciplines() { return disciplines; }

    public void setDefaultLocation(Location defaultLocation) { this.defaultLocation = defaultLocation; }
    public void setFixedLocation(boolean fixedLocation) { this.fixedLocation = fixedLocation; }
    public void setDisciplines(Set<Discipline> disciplines) { this.disciplines = disciplines; }
}
