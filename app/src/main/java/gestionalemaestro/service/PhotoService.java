package gestionalemaestro.service;

import java.util.Optional;

import org.springframework.stereotype.Service;

import gestionalemaestro.model.User;
import gestionalemaestro.model.UserPhoto;
import gestionalemaestro.store.ClientRepository;
import gestionalemaestro.store.JpaUserPhotoRepository;

@Service
public class PhotoService {

    // Il browser la ridimensiona a circa 256x256 prima di inviarla: un JPEG di quella misura pesa poche decine
    // di KB. Il limite è una rete di sicurezza contro chi manda un file diverso, non la misura attesa.
    private static final int MAX_BYTES = 400_000;

    private final JpaUserPhotoRepository photoRepository;
    private final ClientRepository clientRepository;

    public PhotoService(JpaUserPhotoRepository photoRepository, ClientRepository clientRepository) {
        this.photoRepository = photoRepository;
        this.clientRepository = clientRepository;
    }

    public UserPhoto save(User user, byte[] data, String contentType) {
        if (data == null || data.length == 0) {
            throw new DomainException("Nessuna immagine ricevuta");
        }
        if (data.length > MAX_BYTES) {
            throw new DomainException("Immagine troppo grande");
        }
        if (!"image/jpeg".equals(contentType) && !"image/png".equals(contentType)) {
            throw new DomainException("Formato immagine non supportato (usa JPEG o PNG)");
        }
        UserPhoto photo = photoRepository.findByUser(user).orElseGet(() -> new UserPhoto(user, data, contentType));
        photo.setData(data);
        photo.setContentType(contentType);
        return photoRepository.save(photo);
    }

    public void delete(User user) {
        photoRepository.findByUser(user).ifPresent(photoRepository::delete);
    }

    // La propria foto: sempre visibile a se stessi, anche senza collegamenti
    public Optional<UserPhoto> ofSelf(User user) {
        return photoRepository.findByUser(user);
    }

    // La foto di un altro utente, solo se chi guarda ha diritto di vederla:
    // - un istruttore: visibile a chiunque sia autenticato
    // - un cliente: visibile solo all'istruttore a cui è collegato (che ha una sua scheda)
    public Optional<UserPhoto> visibleTo(User viewer, User owner) {
        if (viewer.equals(owner)) {
            return photoRepository.findByUser(owner);
        }
        if (owner.getRole() == User.Role.INSTRUCTOR) {
            return photoRepository.findByUser(owner);
        }
        boolean collegato = clientRepository.findByAccount(owner).stream()
            .anyMatch(c -> viewer.equals(c.getInstructor()));
        return collegato ? photoRepository.findByUser(owner) : Optional.empty();
    }
}
