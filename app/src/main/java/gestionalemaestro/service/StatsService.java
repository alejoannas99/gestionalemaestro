package gestionalemaestro.service;
import java.time.LocalDate;
import java.util.Map;
import java.util.stream.Collectors;

import gestionalemaestro.model.Client;
import gestionalemaestro.store.ClientRepositoryFakeStore;
import gestionalemaestro.store.LessonRepositoryFakeStore;

public class StatsService {

    private final ClientRepositoryFakeStore clientRepository;
    private final LessonRepositoryFakeStore lessonRepository;

    public StatsService(ClientRepositoryFakeStore clientRepository, LessonRepositoryFakeStore lessonRepository) {
        this.clientRepository = clientRepository;
        this.lessonRepository = lessonRepository;
    }

    public int countClients() {
        return clientRepository.findAll().size();
    }

    public int countLessons() {
        return lessonRepository.findAll().size();
    }

    public Map<Client, Integer> clientsWithLessonsInDate(LocalDate date){
              return lessonRepository.findAll().stream()
                                     .filter(l -> l.getDate().equals(date))
                                     .flatMap(l -> l.getClients().stream())
                                     .collect(Collectors.groupingBy(
                                          c -> c,
                                          Collectors.summingInt(c -> 1)
                                     ));
       }   
       
    public Client clientWithMoreLessonsAttended(){
        return clientRepository.findAll().stream()
                                         .max((c1,c2) -> Integer.compare(c1.getLessonsAttended(), c2.getLessonsAttended()))
                                         .orElse(null);
    }       

    
}
