package gestionalemaestro.store;

import org.springframework.data.jpa.repository.JpaRepository;
import gestionalemaestro.model.Client;
import java.util.List;

public interface JpaClientRepository extends JpaRepository<Client, Integer> {
    List<Client> findByNameAndSurname(String name, String surname);
}
