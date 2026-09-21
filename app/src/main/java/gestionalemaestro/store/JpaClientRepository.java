package gestionalemaestro.store;

import org.springframework.data.jpa.repository.JpaRepository;
import gestionalemaestro.model.Client;
import gestionalemaestro.model.User;

import java.util.List;

public interface JpaClientRepository extends JpaRepository<Client, Integer> {
    List<Client> findByNameAndSurname(String name, String surname);
    List<Client> findByInstructor(User instructor);
    List<Client> findByNameIgnoreCaseAndSurnameIgnoreCase(String name, String surname);
    List<Client> findByAccountsContains(User user);
}
