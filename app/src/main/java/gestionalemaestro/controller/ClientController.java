package gestionalemaestro.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.dto.ClientDTO;
import gestionalemaestro.model.Client;
import gestionalemaestro.model.Instructor;
import gestionalemaestro.service.ClientService;
import gestionalemaestro.service.DomainException;
import gestionalemaestro.service.DuplicateException;

@RestController
@RequestMapping("/clienti")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    private Instructor getLoggedInstructor() {
        return (Instructor) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
    }

    @GetMapping
    public List<ClientDTO> getClienti() {
        return clientService.showClients(getLoggedInstructor())
            .stream()
            .map(ClientDTO::from)
            .toList();
    }

    @PostMapping
    public ResponseEntity<String> addCliente(@RequestBody ClienteRequest request) {
        try {
            clientService.addClient(
                request.nome(),
                request.cognome(),
                request.telefono() != null ? Optional.of(request.telefono()) : null,
                getLoggedInstructor()
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
        Client c = clientService.findByCode(code, getLoggedInstructor());
        if (c == null) {
            return ResponseEntity.status(404).body("Cliente non trovato");
        }
        clientService.removeClient(c);
        return ResponseEntity.ok("Cliente rimosso");
    }

    @PutMapping("/{code}")
    public ResponseEntity<String> updateCliente (@PathVariable Integer code, @RequestBody ClienteRequest request) {
        Client c = clientService.findByCode(code, getLoggedInstructor());
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
