package gestionalemaestro.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.model.Location;
import gestionalemaestro.model.User;
import gestionalemaestro.model.UserSettings;
import gestionalemaestro.service.DomainException;
import gestionalemaestro.service.SettingsService;

// Impostazioni dell'utente loggato (istruttore o cliente)
@RestController
@RequestMapping("/impostazioni")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    private User getLoggedUser() {
        return (User) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
    }

    @GetMapping
    public SettingsResponse get() {
        return SettingsResponse.from(settingsService.get(getLoggedUser()));
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody SettingsRequest request) {
        try {
            UserSettings saved = settingsService.update(getLoggedUser(),
                request.locationName(), request.latitude(), request.longitude(), request.fixedLocation());
            return ResponseEntity.ok(SettingsResponse.from(saved));
        } catch (DomainException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    record SettingsRequest(String locationName, Double latitude, Double longitude, boolean fixedLocation) {}

    record SettingsResponse(String locationName, Double latitude, Double longitude, boolean fixedLocation) {
        static SettingsResponse from(UserSettings s) {
            Location l = s.getDefaultLocation();
            return new SettingsResponse(
                l != null ? l.getName() : null,
                l != null ? l.getLatitude() : null,
                l != null ? l.getLongitude() : null,
                s.isFixedLocation());
        }
    }
}
