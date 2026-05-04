package gestionalemaestro.controller;

import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.model.Client;
import gestionalemaestro.service.StatsService;

@RestController
@RequestMapping("/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    @GetMapping("/clienti")
    public int countClienti() {
        return statsService.countClients();
    }

    @GetMapping("/lezioni")
    public int countLezioni() {
        return statsService.countLessons();
    }

    @GetMapping("/top-cliente")
    public ResponseEntity<?> topCliente() {
        Client c = statsService.clientWithMoreLessonsAttended();
        if (c == null) {
            return ResponseEntity.status(404).body("Nessun cliente registrato");
        }
        return ResponseEntity.ok(c);
    }

    @GetMapping("/lezioni-per-data")
    public ResponseEntity<?> lezioniPerData(@RequestParam String data) {
        try {
            LocalDate date = LocalDate.parse(data);
            return ResponseEntity.ok(statsService.clientsWithLessonsInDate(date));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Formato data non valido, usa: YYYY-MM-DD");
        }
    }
}

