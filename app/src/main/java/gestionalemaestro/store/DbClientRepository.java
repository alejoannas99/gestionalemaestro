package gestionalemaestro.store;

import java.util.List;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;
import gestionalemaestro.model.Client;
import gestionalemaestro.service.DomainException;

@Repository
@Primary
public class DbClientRepository implements ClientRepository {

    private final JpaClientRepository jpa;

    public DbClientRepository(JpaClientRepository jpa) {
        this.jpa = jpa;
    }

    public void save(Client client) {
        jpa.save(client);
    }

    public void remove(Client client) {
        jpa.delete(client);
    }

    public List<Client> findAll() {
        return jpa.findAll();
    }

    public List<Client> findByCodes(List<Integer> codes) {
        List<Client> found = jpa.findAllById(codes);
        if (found.size() != codes.size()) {
            throw new DomainException("Uno o più clienti non trovati");
        }
        return found;
    }
}
