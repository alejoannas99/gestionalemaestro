package gestionalemaestro.model;

import jakarta.persistence.*;

// Impostazioni di un utente. Oggi: località predefinita; qui si aggiungono le impostazioni future.
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

    protected UserSettings() {}

    public UserSettings(User user) {
        this.user = user;
    }

    public Integer getId() { return id; }
    public User getUser() { return user; }
    public Location getDefaultLocation() { return defaultLocation; }
    public boolean isFixedLocation() { return fixedLocation; }

    public void setDefaultLocation(Location defaultLocation) { this.defaultLocation = defaultLocation; }
    public void setFixedLocation(boolean fixedLocation) { this.fixedLocation = fixedLocation; }
}
