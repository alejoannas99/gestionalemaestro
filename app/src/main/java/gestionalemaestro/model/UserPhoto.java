package gestionalemaestro.model;

import jakarta.persistence.*;

// Foto profilo di un utente (istruttore o cliente): l'immagine già ridimensionata dal browser, salvata nel database.
@Entity
@Table(name = "user_photos")
public class UserPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    // bytea in PostgreSQL: i byte dell'immagine così come arrivano dal browser.
    // Niente @Lob: con Hibernate 6 + PostgreSQL, su un array di byte @Lob può far usare un "large
    // object" a parte (colonna oid) invece dei byte diretti nella riga (bytea). columnDefinition
    // forza il tipo giusto indipendentemente da come Hibernate lo indovinerebbe da solo.
    @Column(nullable = false, columnDefinition = "bytea")
    private byte[] data;

    // "image/jpeg" — serve per rispondere con il Content-Type giusto
    @Column(nullable = false)
    private String contentType;

    protected UserPhoto() {}

    public UserPhoto(User user, byte[] data, String contentType) {
        this.user = user;
        this.data = data;
        this.contentType = contentType;
    }

    public Integer getId() { return id; }
    public User getUser() { return user; }
    public byte[] getData() { return data; }
    public String getContentType() { return contentType; }

    public void setData(byte[] data) { this.data = data; }
    public void setContentType(String contentType) { this.contentType = contentType; }
}
