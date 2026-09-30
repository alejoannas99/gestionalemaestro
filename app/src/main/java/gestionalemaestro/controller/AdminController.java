package gestionalemaestro.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import gestionalemaestro.model.User;
import gestionalemaestro.service.AdminService;
import gestionalemaestro.service.DomainException;

// Non protetto da un ruolo (non esiste un ruolo ADMIN): chiunque sia loggato può chiamare
// questi endpoint, ma solo l'account con l'email in app.admin-email ottiene una risposta
// diversa da 403. Così non serve toccare Role né il resto della sicurezza per un solo account.
// In più, oltre alla password di login, ogni chiamata (tranne "sono-admin") richiede un PIN
// separato nell'header X-Admin-Pin: protegge anche da un click per sbaglio o da un token
// rubato/dimenticato aperto, dato che il PIN non sta nel token.
@RestController
@RequestMapping("/admin")
public class AdminController {

    private final AdminService adminService;
    private final String adminEmail;
    private final String adminPin;

    public AdminController(AdminService adminService,
                           @Value("${app.admin-email}") String adminEmail,
                           @Value("${app.admin-pin}") String adminPin) {
        this.adminService = adminService;
        this.adminEmail = adminEmail;
        this.adminPin = adminPin;
    }

    private User getLoggedUser() {
        return (User) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
    }

    private ResponseEntity<String> checkAdmin(String pin) {
        if (!adminEmail.equalsIgnoreCase(getLoggedUser().getEmail())) {
            return ResponseEntity.status(403).body("Non autorizzato");
        }
        if (!adminPin.equals(pin)) {
            return ResponseEntity.status(401).body("PIN non valido");
        }
        return null;
    }

    // Non è un dato sensibile (non svela nulla che l'account stesso non sappia già): serve solo
    // al frontend per decidere se mostrare la voce "Admin" nel menu. Niente PIN richiesto qui,
    // altrimenti non si potrebbe nemmeno capire se mostrare la voce che chiede il PIN.
    @GetMapping("/sono-admin")
    public boolean sonoAdmin() {
        return adminEmail.equalsIgnoreCase(getLoggedUser().getEmail());
    }

    @GetMapping("/istruttori-in-attesa")
    public ResponseEntity<?> istruttoriInAttesa(@RequestHeader(value = "X-Admin-Pin", required = false) String pin) {
        ResponseEntity<String> denied = checkAdmin(pin);
        if (denied != null) return denied;
        return ResponseEntity.ok(adminService.pendingInstructors());
    }

    // Se il database non risponde, questa chiamata stessa fallisce: la catturiamo per dare
    // un messaggio chiaro invece del solito 500 generico senza spiegazione.
    @GetMapping("/stato")
    public ResponseEntity<?> stato(@RequestHeader(value = "X-Admin-Pin", required = false) String pin) {
        ResponseEntity<String> denied = checkAdmin(pin);
        if (denied != null) return denied;
        try {
            return ResponseEntity.ok(adminService.stato());
        } catch (Exception e) {
            return ResponseEntity.status(503).body("Database non raggiungibile: " + e.getMessage());
        }
    }

    @GetMapping("/errori-recenti")
    public ResponseEntity<?> erroriRecenti(@RequestHeader(value = "X-Admin-Pin", required = false) String pin) {
        ResponseEntity<String> denied = checkAdmin(pin);
        if (denied != null) return denied;
        return ResponseEntity.ok(adminService.erroriRecenti());
    }

    @PostMapping("/istruttori/{id}/approva")
    public ResponseEntity<String> approva(@PathVariable Integer id,
                                          @RequestHeader(value = "X-Admin-Pin", required = false) String pin) {
        ResponseEntity<String> denied = checkAdmin(pin);
        if (denied != null) return denied;
        try {
            adminService.approve(id);
            return ResponseEntity.ok("Istruttore approvato");
        } catch (DomainException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @PostMapping("/istruttori/{id}/rifiuta")
    public ResponseEntity<String> rifiuta(@PathVariable Integer id,
                                          @RequestHeader(value = "X-Admin-Pin", required = false) String pin) {
        ResponseEntity<String> denied = checkAdmin(pin);
        if (denied != null) return denied;
        try {
            adminService.reject(id);
            return ResponseEntity.ok("Richiesta rifiutata");
        } catch (DomainException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }
}
