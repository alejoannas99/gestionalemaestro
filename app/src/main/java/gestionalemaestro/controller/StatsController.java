package gestionalemaestro.controller;

import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.User;
import gestionalemaestro.service.StatsService;

@RestController
@RequestMapping("/stats")
public class StatsController {

    private final StatsService statsService;

    public StatsController(StatsService statsService) {
        this.statsService = statsService;
    }

    private User getLoggedUser() {
        return (User) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
    }

    @GetMapping("/clienti")
    public int countClienti() {
        return statsService.countClients(getLoggedUser());
    }

    @GetMapping("/lezioni")
    public int countLezioni() {
        return statsService.countLessons(getLoggedUser());
    }

    @GetMapping("/top-cliente")
    public ResponseEntity<?> topCliente() {
        Client c = statsService.clientWithMoreLessonsAttended(getLoggedUser());
        if (c == null) {
            return ResponseEntity.status(404).body("Nessun cliente registrato");
        }
        return ResponseEntity.ok(c);
    }

    @GetMapping("/lezioni-per-data")
    public ResponseEntity<?> lezioniPerData(@RequestParam String data) {
        try {
            LocalDate date = LocalDate.parse(data);
            return ResponseEntity.ok(statsService.clientsWithLessonsInDate(date, getLoggedUser()));
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Formato data non valido, usa: YYYY-MM-DD");
        }
    }

    @GetMapping("/ore-anno")
        public double oreAnno(@RequestParam int anno) {
        return statsService.countHoursInSeason(getLoggedUser(), anno);
    }

    @GetMapping("/ore-mese")
    public double oreMese(@RequestParam int mese, @RequestParam int anno) {
        return statsService.countHoursxMonth(getLoggedUser(), mese, anno);
    }
}

