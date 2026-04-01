package gestionalemaestro.service;

import java.util.List;

import gestionalemaestro.model.Client;
import gestionalemaestro.store.ClientRepository;


public class ClientService {

    private int id = 0;
    private final ClientRepository clientRepository;
    
    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }


    public void addClient(String name, String surname, String numTel) throws IllegalArgumentException { 
        id++;
        String code = String.valueOf(id);
        if(!(name == null || name.equals("")) && !(surname == null || surname.equals(""))){
        if(isNew(name, surname)){
        Client c = new Client(code,name,surname);
        c.setNumTel(numTel);
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

    public List<Client> showClients(){
        return clientRepository.findAll();
    }
    
    public boolean isNew(String name, String surname){
        return clientRepository.findAll().stream()
            .filter(c -> c.getName().equals(name) && c.getSurname().equals(surname))
            .findFirst()
            .isEmpty();

    }

    public List<Client> clientsdoingLesson(List<String> codes){
        Boolean allPresent = codes.stream()
                                  .allMatch(c -> clientRepository.findAll().stream()
                                                            .filter(cl -> cl.getCode().equals(c))
                                                            .findFirst()
                                                            .isPresent());
        if(!allPresent){
            throw new DomainException("tutti i clienti dovrebbero essere registrati prima");
        }
        return clientRepository.findAll().stream()
                                    .filter(c -> codes.contains(c.getCode()))
                                    .toList();
    }





}
