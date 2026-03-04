package gestionalemaestro.store;
import java.util.List;

import gestionalemaestro.model.Client;

public class ClientRepository {

    public void save(Client client) {
        FakeStore.clients.add(client);
    }

    public void remove(Client client){
        FakeStore.clients.remove(client);
    }

    public List<Client> findAll(){
        return List.copyOf(FakeStore.clients);
    }
}
