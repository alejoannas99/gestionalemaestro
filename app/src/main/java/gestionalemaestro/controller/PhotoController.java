package gestionalemaestro.controller;

import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import gestionalemaestro.model.User;
import gestionalemaestro.model.UserPhoto;
import gestionalemaestro.service.DomainException;
import gestionalemaestro.service.PhotoService;
import gestionalemaestro.store.JpaUserRepository;

// Foto profilo. Non sotto /me (solo cliente) né /clienti ecc. (solo istruttore): serve a entrambi i ruoli.
@RestController
@RequestMapping("/foto")
public class PhotoController {

    private final PhotoService photoService;
    private final JpaUserRepository userRepository;

    public PhotoController(PhotoService photoService, JpaUserRepository userRepository) {
        this.photoService = photoService;
        this.userRepository = userRepository;
    }

    private User getLoggedUser() {
        return (User) SecurityContextHolder.getContext()
            .getAuthentication().getPrincipal();
    }

    @PutMapping
    public ResponseEntity<String> caricaFoto(@RequestParam("file") MultipartFile file) {
        try {
            photoService.save(getLoggedUser(), file.getBytes(), file.getContentType());
            return ResponseEntity.ok("Foto salvata");
        } catch (DomainException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Impossibile leggere l'immagine");
        }
    }

    @DeleteMapping
    public ResponseEntity<String> rimuoviFoto() {
        photoService.delete(getLoggedUser());
        return ResponseEntity.ok("Foto rimossa");
    }

    @GetMapping("/me")
    public ResponseEntity<byte[]> laMiaFoto() {
        return rispondi(photoService.ofSelf(getLoggedUser()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> fotoDi(@PathVariable Integer id) {
        Optional<User> owner = userRepository.findById(id);
        if (owner.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return rispondi(photoService.visibleTo(getLoggedUser(), owner.get()));
    }

    // 404 sia se la foto non esiste sia se chi guarda non ha diritto di vederla: non si distinguono i due casi
    private ResponseEntity<byte[]> rispondi(Optional<UserPhoto> photo) {
        return photo
            .map(p -> ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(p.getContentType()))
                // niente cache: /foto/me è lo stesso indirizzo per chiunque lo chiami, cambia solo il token.
                // Una cache per indirizzo mostrerebbe la foto di un altro utente a chi si collega dopo di lui.
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(p.getData()))
            .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
