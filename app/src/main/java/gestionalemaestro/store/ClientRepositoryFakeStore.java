package gestionalemaestro.store;
import java.util.List;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.Instructor;
import gestionalemaestro.service.DomainException;

import org.springframework.stereotype.Repository;

@Repository
public class ClientRepositoryFakeStore implements ClientRepository {

    public void save(Client client) {
        FakeStore.clients.add(client);
    }

    public void remove(Client client){
        FakeStore.clients.remove(client);
    }

    public List<Client> findAll(){
        return List.copyOf(FakeStore.clients);
    }


    public List<Client> findByCodes(List<Integer> codes){
        Boolean allPresent = codes.stream()
                                  .allMatch(c -> findAll().stream()
                                                            .filter(cl -> cl.getCode().equals(c))
                                                            .findFirst()
                                                            .isPresent());
        if(!allPresent){
            throw new DomainException("tutti i clienti dovrebbero essere registrati prima");
        }
        return findAll().stream()
                        .filter(c -> codes.contains(c.getCode()))
                        .toList();
    }

    public List<Client> findByInstructor(Instructor instructor) {
        return FakeStore.clients.stream()
            .filter(c -> c.getInstructor().equals(instructor))
            .toList();
    }
}
