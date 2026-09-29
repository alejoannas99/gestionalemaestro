package gestionalemaestro.service;

import java.util.Set;

import org.springframework.stereotype.Service;

import gestionalemaestro.model.Discipline;
import gestionalemaestro.model.Location;
import gestionalemaestro.model.User;
import gestionalemaestro.model.UserSettings;
import gestionalemaestro.store.JpaUserSettingsRepository;

@Service
public class SettingsService {

    private final JpaUserSettingsRepository settingsRepository;

    public SettingsService(JpaUserSettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    // Se l'utente non ha ancora impostazioni si restituiscono quelle vuote (senza salvarle)
    public UserSettings get(User user) {
        return settingsRepository.findByUser(user).orElseGet(() -> new UserSettings(user));
    }

    // Nome vuoto o coordinate mancanti = località non impostata
    public UserSettings update(User user, String locationName, Double latitude, Double longitude,
                                boolean fixedLocation, Set<Discipline> disciplines) {
        UserSettings settings = get(user);
        Location location = buildLocation(locationName, latitude, longitude);
        if (fixedLocation && location == null) {
            throw new DomainException("Per avere la località fissa scegli prima una località");
        }
        if (user.getRole() == User.Role.INSTRUCTOR && (disciplines == null || disciplines.isEmpty())) {
            throw new DomainException("Scegli almeno una disciplina (sci o snowboard)");
        }
        settings.setDefaultLocation(location);
        settings.setFixedLocation(fixedLocation);
        settings.setDisciplines(disciplines != null ? disciplines : Set.of());
        return settingsRepository.save(settings);
    }

    // Quale località finisce in una lezione:
    // - località fissa: sempre la predefinita
    // - altrimenti: quella scelta nel form, e se manca la predefinita
    public Location resolveLocation(User instructor, Location requested) {
        UserSettings settings = get(instructor);
        if (settings.isFixedLocation() && settings.getDefaultLocation() != null) {
            return settings.getDefaultLocation();
        }
        return requested != null ? requested : settings.getDefaultLocation();
    }

    // Crea una Location solo se i dati sono completi e sensati, altrimenti null; errore se le coordinate sono impossibili
    public Location buildLocation(String name, Double latitude, Double longitude) {
        if (name == null || name.isBlank() || latitude == null || longitude == null) {
            return null;
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new DomainException("Coordinate non valide");
        }
        return new Location(name, latitude, longitude);
    }
}
