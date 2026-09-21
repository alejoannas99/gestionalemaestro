package gestionalemaestro.controller;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.dto.LessonDTO;
import gestionalemaestro.model.Client;
import gestionalemaestro.model.User;
import gestionalemaestro.model.Lesson;
import gestionalemaestro.model.Location;
import gestionalemaestro.service.ClientService;
import gestionalemaestro.service.DomainException;
import gestionalemaestro.service.LessonService;
import gestionalemaestro.service.SettingsService;

@RestController
@RequestMapping("/lezioni")
public class LessonController {

    private final LessonService lessonService;
    private final ClientService clientService;
    private final SettingsService settingsService;

    public LessonController(LessonService lessonService, ClientService clientService, SettingsService settingsService) {
        this.lessonService = lessonService;
        this.clientService = clientService;
        this.settingsService = settingsService;
    }

    private User getLoggedUser() {
        return (User) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
    }

    @GetMapping
    public List<LessonDTO> getLezioni() {
        return lessonService.showLessons(getLoggedUser())
            .stream()
            .map(LessonDTO::from)
            .toList();
    }

    @PostMapping
    public ResponseEntity<String> newLezione(@RequestBody LezioneRequest request) {
        try {
            LocalDate date = LocalDate.parse(request.data());
            LocalTime start = LocalTime.parse(request.inizio());
            LocalTime finish = LocalTime.parse(request.fine());
            List<Client> clients = clientService.clientsdoingLesson(request.codiciClienti(), getLoggedUser());
            Location requested = settingsService.buildLocation(request.locationName(), request.latitude(), request.longitude());
            Location location = settingsService.resolveLocation(getLoggedUser(), requested);
            lessonService.newLesson(start, date, finish, clients, getLoggedUser(), location);
            return ResponseEntity.status(201).body("Lezione creata");
        } catch (DomainException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Formato data o ora non valido");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> removeLezione(@PathVariable int id) {
        Lesson l = lessonService.findById(id, getLoggedUser());
        if (l == null) {
            return ResponseEntity.status(404).body("Lezione non trovata");
        }
        lessonService.removeLesson(id);
        return ResponseEntity.ok("Lezione rimossa");
    }

    @PutMapping("/{id}")
    public ResponseEntity<String> modifyLezione(@PathVariable int id, @RequestBody LezioneRequest request) {
        try {
            Lesson l = lessonService.findById(id, getLoggedUser());
            if (l == null) {
                return ResponseEntity.status(404).body("Lezione non trovata");
            }
            LocalDate date = LocalDate.parse(request.data());
            LocalTime start = LocalTime.parse(request.inizio());
            LocalTime finish = LocalTime.parse(request.fine());
            List<Client> clients = clientService.clientsdoingLesson(request.codiciClienti(), getLoggedUser());
            Location requested = settingsService.buildLocation(request.locationName(), request.latitude(), request.longitude());
            if (requested == null) {
                requested = l.getLocation(); // la richiesta non la indica: si tiene quella che la lezione ha già
            }
            Location location = settingsService.resolveLocation(getLoggedUser(), requested);
            lessonService.modifyLesson(l, date, start, finish, clients, location);
            return ResponseEntity.ok("Lezione modificata");
        } catch (DomainException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    // La località è facoltativa: se manca vale quella predefinita dell'istruttore
    record LezioneRequest(String data, String inizio, String fine, List<Integer> codiciClienti,
                          String locationName, Double latitude, Double longitude) {}
}
