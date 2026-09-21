package gestionalemaestro.store;

import java.util.List;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.User;

public interface ClientRepository {
    
    void save(Client client);

    void remove(Client client);

    List<Client> findAll();

    List<Client> findByCodes(List<Integer> codes);

    List<Client> findByInstructor(User instructor);

    List<Client> findByFullName(String name, String surname);

    List<Client> findByAccount(User account);

}
