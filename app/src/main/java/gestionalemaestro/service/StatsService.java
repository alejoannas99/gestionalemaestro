package gestionalemaestro.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.time.Duration;

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

    public double countHoursInSeason(Instructor instructor, int year) {

        LocalDate now = LocalDate.now();
             
        year = now.getMonthValue() >= 11
                        ? year
                        : year - 1;

        LocalDate start = LocalDate.of(year, 11, 1);
        LocalDate end = LocalDate.of(year + 1, 10, 31);

        return lessonRepository.findByInstructor(instructor)
                .stream()
                .filter(l -> !l.getDate().isBefore(start) && !l.getDate().isAfter(end))
                .mapToDouble(l ->
                                Duration.between(
                                    l.getStart(),
                                    l.getFinish()
                                ).toMinutes() / 60.0
                )
                .sum();
    }

    public double countHoursxMonth(Instructor instructor, int month, int year) {
              return lessonRepository.findByInstructor(instructor).stream()
              .filter(l -> l.getDate().getMonthValue() == month)
              .filter(l -> l.getDate().getYear() == year)
              .mapToDouble(l -> l.getDurationInHours())
              .sum();
       }

    public record ClienteLessonCount(Integer code, String nome, String cognome, int lezioni) {}
}