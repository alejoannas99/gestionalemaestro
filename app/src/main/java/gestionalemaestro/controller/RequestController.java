package gestionalemaestro.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.model.User;
import gestionalemaestro.service.DomainException;
import gestionalemaestro.service.LinkService;

// Richieste di collegamento ricevute da un istruttore
@RestController
@RequestMapping("/richieste")
public class RequestController {

    private final LinkService linkService;

    public RequestController(LinkService linkService) {
        this.linkService = linkService;
    }

    private User getLoggedUser() {
        return (User) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
    }

    @GetMapping
    public List<LinkService.PendingRequest> getRichieste() {
        return linkService.pendingFor(getLoggedUser());
    }

    @PostMapping("/{id}/approva")
    public ResponseEntity<String> approva(@PathVariable Integer id) {
        try {
            linkService.approve(getLoggedUser(), id);
            return ResponseEntity.ok("Richiesta approvata");
        } catch (DomainException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping("/{id}/rifiuta")
    public ResponseEntity<String> rifiuta(@PathVariable Integer id) {
        try {
            linkService.reject(getLoggedUser(), id);
            return ResponseEntity.ok("Richiesta rifiutata");
        } catch (DomainException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}
