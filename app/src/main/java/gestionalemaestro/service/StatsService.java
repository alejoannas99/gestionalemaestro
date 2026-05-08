package gestionalemaestro.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.Instructor;
import gestionalemaestro.store.ClientRepository;
import gestionalemaestro.store.LessonRepository;

@Service
public class StatsService {

    private final ClientRepository clientRepository;
    private final LessonRepository lessonRepository;

    public StatsService(ClientRepository clientRepository, LessonRepository lessonRepository) {
        this.clientRepository = clientRepository;
        this.lessonRepository = lessonRepository;
    }

    public int countClients(Instructor instructor) {
        return clientRepository.findByInstructor(instructor).size();
    }

    public int countLessons(Instructor instructor) {
        return lessonRepository.findByInstructor(instructor).size();
    }

    public List<ClienteLessonCount> clientsWithLessonsInDate(LocalDate date, Instructor instructor) {
        Map<Client, Integer> map = lessonRepository.findByInstructor(instructor).stream()
            .filter(l -> l.getDate().equals(date))
            .flatMap(l -> l.getClients().stream())
            .collect(Collectors.groupingBy(
                c -> c,
                Collectors.summingInt(c -> 1)
            ));

        return map.entrySet().stream()
            .map(e -> new ClienteLessonCount(
                e.getKey().getCode(),
                e.getKey().getName(),
                e.getKey().getSurname(),
                e.getValue()
            ))
            .toList();
    }

    public Client clientWithMoreLessonsAttended(Instructor instructor) {
        return clientRepository.findByInstructor(instructor).stream()
            .max((c1, c2) -> Integer.compare(
                c1.getLessonsAttended(),
                c2.getLessonsAttended()))
            .orElse(null);
    }

    public record ClienteLessonCount(Integer code, String nome, String cognome, int lezioni) {}
}