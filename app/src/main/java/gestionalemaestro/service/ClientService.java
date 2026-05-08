package gestionalemaestro.service;

import java.util.List;
import java.util.Optional;

import gestionalemaestro.model.Client;
import gestionalemaestro.store.ClientRepository;
import gestionalemaestro.model.Instructor;

import org.springframework.stereotype.Service;

@Service
public class ClientService {

    private final ClientRepository clientRepository;
    
    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }


    public void addClient(String name, String surname, Optional<String> numTel, Instructor instructor) throws IllegalArgumentException { 
        if(!(name == null || name.equals("")) && !(surname == null || surname.equals(""))){
        if(isNew(name, surname,instructor)){
        Client c = new Client(name,surname);
        c.setInstructor(instructor);
        if(numTel != null){
            c.setNumTel(numTel);
        }
        clientRepository.save(c);
        }
        else{
            throw new DuplicateException("Cliente duplicato o omonimo");
        }
    }
    else{
        throw new DomainException("Name and Surname are required");
    }
    }

    public void removeClient(Client c){
        clientRepository.remove(c);
    }

    public List<Client> showClients(Instructor instructor) {
        return clientRepository.findByInstructor(instructor);
    }
    
    public boolean isNew(String name, String surname, Instructor instructor){
        return clientRepository.findByInstructor(instructor).stream()
            .filter(c -> c.getName().equals(name) && c.getSurname().equals(surname))
            .findFirst()
            .isEmpty();

    }

    public Client findByCode(Integer code, Instructor instructor) {
        return showClients(instructor).stream()
            .filter(c -> c.getCode().equals(code))
            .findFirst()
            .orElse(null);
    }

    public void updateClient(Client c) {
        clientRepository.save(c);
    }

    public List<Client> clientsdoingLesson(List<Integer> clientIds){
        return clientRepository.findByCodes(clientIds);
    }







}
