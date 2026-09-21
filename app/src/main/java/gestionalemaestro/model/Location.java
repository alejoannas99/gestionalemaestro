package gestionalemaestro.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

// Un luogo con le coordinate (servono per il meteo). @Embeddable: non ha una tabella sua,
// le sue colonne stanno nella tabella dell'entità che lo contiene (Lesson, UserSettings).
@Embeddable
public class Location {

    @Column(name = "location_name")
    private String name;

    private Double latitude;
    private Double longitude;

    protected Location() {}

    public Location(String name, Double latitude, Double longitude) {
        this.name = NameUtil.normalize(name);
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public String getName() { return name; }
    public Double getLatitude() { return latitude; }
    public Double getLongitude() { return longitude; }
}
