package gestionalemaestro.service;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

import java.util.List;

import gestionalemaestro.model.Client;
import gestionalemaestro.store.ClientRepository;
import gestionalemaestro.store.FakeStore;

public class ClientServiceTest {
// Resetta la lista prima di ogni test
    private void resetStore() {
        FakeStore.clients.clear();
    }

    @Test
    void testAddClient() {
        resetStore();
        ClientRepository repo = new ClientRepository();
        ClientService service = new ClientService(repo);

        service.addClient("Mario", "Rossi", "123456");

        List<Client> clients = service.showClients();
        assertEquals(1, clients.size());
        Client c = clients.get(0);
        assertEquals("Mario", c.getName());
        assertEquals("Rossi", c.getSurname());
        assertEquals("123456", c.getNumTel().orElse(""));
    }

    @Test
    void testAddDuplicateClientThrows() {
        resetStore();
        ClientRepository repo = new ClientRepository();
        ClientService service = new ClientService(repo);

        service.addClient("Mario", "Rossi", "123456");

        Exception e = assertThrows(RuntimeException.class, () -> {
            service.addClient("Mario", "Rossi", "654321");
        });
        assertTrue(e.getMessage().contains("duplicato"));
    }

    @Test
    void testRemoveClient() {
        resetStore();
        ClientRepository repo = new ClientRepository();
        ClientService service = new ClientService(repo);

        service.addClient("Luca", "Bianchi", "987654");
        Client c = service.showClients().get(0);

        service.removeClient(c);

        assertEquals(0, service.showClients().size());
    }

    @Test
    void testIsNew() {
        resetStore();
        ClientRepository repo = new ClientRepository();
        ClientService service = new ClientService(repo);

        assertTrue(service.isNew("Anna", "Verdi"));
        service.addClient("Anna", "Verdi", "111222");
        assertFalse(service.isNew("Anna", "Verdi"));
    }
}
