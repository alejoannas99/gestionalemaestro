package gestionalemaestro.service;
import gestionalemaestro.store.ClientRepository;
import gestionalemaestro.store.LessonRepository;

public class StatsService {

    private final ClientRepository clientRepository;
    private final LessonRepository lessonRepository;

    public StatsService(ClientRepository clientRepository, LessonRepository lessonRepository) {
        this.clientRepository = clientRepository;
        this.lessonRepository = lessonRepository;
    }

    public int countClients() {
        return clientRepository.findAll().size();
    }

    public int countLessons() {
        return lessonRepository.findAll().size();
    }

    
}
