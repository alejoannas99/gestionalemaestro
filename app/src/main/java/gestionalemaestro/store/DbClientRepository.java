package gestionalemaestro.store;

import java.util.List;

import gestionalemaestro.model.Client;

public class DbClientRepository implements ClientRepository {

    public void save(Client client) { /* query SQL */ }
    public void remove(Client client) { /* query SQL */ }
    public List<Client> findAll() { /* query SQL */  return null;}
    public List<Client> findByCodes(List<String> codes) { /* query SQL */ return null; }

}
