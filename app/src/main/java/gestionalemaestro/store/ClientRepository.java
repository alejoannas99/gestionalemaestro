package gestionalemaestro.store;

import java.util.List;

import gestionalemaestro.model.Client;

public interface ClientRepository {
    
    void save(Client client);

    void remove(Client client);

    List<Client> findAll();

    List<Client> findByCodes(List<String> codes);

}
