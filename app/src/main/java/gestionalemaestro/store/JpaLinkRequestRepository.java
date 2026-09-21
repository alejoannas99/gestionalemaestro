package gestionalemaestro.store;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.LinkRequest;
import gestionalemaestro.model.User;

public interface JpaLinkRequestRepository extends JpaRepository<LinkRequest, Integer> {
    // richieste ancora da decidere per un istruttore
    List<LinkRequest> findByInstructorAndStatus(User instructor, LinkRequest.Status status);

    // le richieste fatte da un account cliente
    List<LinkRequest> findByUser(User user);

    // per non creare due richieste uguali in attesa
    boolean existsByUserAndClientAndStatus(User user, Client client, LinkRequest.Status status);
}
