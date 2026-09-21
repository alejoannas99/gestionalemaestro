package gestionalemaestro.controller;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.dto.ClientDTO;
import gestionalemaestro.model.Client;
import gestionalemaestro.model.User;
import gestionalemaestro.service.ClientService;
import gestionalemaestro.service.DomainException;
import gestionalemaestro.service.DuplicateException;
import gestionalemaestro.service.LessonService;

@RestController
@RequestMapping("/clienti")
public class ClientController {

    private final ClientService clientService;
    private final LessonService lessonService;

    public ClientController(ClientService clientService, LessonService lessonService) {
        this.clientService = clientService;
        this.lessonService = lessonService;
    }

    private User getLoggedUser() {
        return (User) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
    }

    @GetMapping
    public List<ClientDTO> getClienti() {
        User instructor = getLoggedUser();
        Map<Integer, Long> svolte = lessonService.finishedLessonsPerClient(instructor);
        return clientService.showClients(instructor)
            .stream()
            .map(c -> ClientDTO.from(c, svolte.getOrDefault(c.getCode(), 0L).intValue()))
            .toList();
    }

    @PostMapping
    public ResponseEntity<String> addCliente(@RequestBody ClienteRequest request) {
        try {
            clientService.addClient(
                request.nome(),
                request.cognome(),
                request.telefono() != null ? Optional.of(request.telefono()) : null,
                getLoggedUser()
            );
        return ResponseEntity.status(201).body("Cliente aggiunto");
        } catch (DuplicateException e) {
        return ResponseEntity.status(409).body(e.getMessage());
        } catch (DomainException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @DeleteMapping("/{code}")
    public ResponseEntity<String> removeCliente(@PathVariable Integer code) {
        Client c = clientService.findByCode(code, getLoggedUser());
        if (c == null) {
            return ResponseEntity.status(404).body("Cliente non trovato");
        }
        clientService.removeClient(c);
        return ResponseEntity.ok("Cliente rimosso");
    }

    @PutMapping("/{code}")
    public ResponseEntity<String> updateCliente (@PathVariable Integer code, @RequestBody ClienteRequest request) {
        Client c = clientService.findByCode(code, getLoggedUser());
        if (c == null) {
            return ResponseEntity.status(404).body("Cliente non trovato");
        }
        c.update(request.nome(), request.cognome());
        if (request.telefono() != null) {
            c.setNumTel(Optional.of(request.telefono()));
        }
        clientService.updateClient(c);
        return ResponseEntity.ok("Cliente aggiornato");
    }

    record ClienteRequest(String nome, String cognome, String telefono) {}
}
