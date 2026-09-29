package gestionalemaestro.service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


import gestionalemaestro.model.Client;
import gestionalemaestro.model.Discipline;
import gestionalemaestro.model.Lesson;
import gestionalemaestro.model.Location;
import gestionalemaestro.store.LessonRepository;
import gestionalemaestro.store.ClientRepository;
import gestionalemaestro.model.User;


import org.springframework.stereotype.Service;

@Service
public class LessonService {

       private final LessonRepository lessonRepository;
       private final ClientRepository clientRepository;

       public LessonService(LessonRepository lessonRepository, ClientRepository clientRepository) {
              this.lessonRepository = lessonRepository;
              this.clientRepository = clientRepository;
       }

       public void newLesson(LocalTime start, LocalDate date, LocalTime finish, List<Client> clients, User instructor, Location location, Discipline discipline) throws IllegalArgumentException {
       boolean hasOverlap = lessonRepository.findByInstructor(instructor).stream()
                                            .filter(l -> l.getDate().equals(date))
                                            .anyMatch(l -> l.getClients().stream()
                                                                         .anyMatch(c -> clients.contains(c)) &&!(finish.isBefore(l.getStart()) || start.isAfter(l.getFinish()))
                                          );
    
              if (hasOverlap) {
              throw new DomainException("Uno o più clienti hanno già una lezione in questo orario");
       }
              if(clients.size() == 0){
                     throw new DomainException("Almeno un cliente è richiesto");       
              }
              else if(finish.isBefore(start) || finish.equals(start)){
                     throw new DomainException("La fine della lezione deve essere dopo l'inizio");
              }
              else if(discipline == null){
                     throw new DomainException("Scegli la disciplina della lezione (sci o snowboard)");
              }
              else if(lessonRepository.findByInstructor(instructor).stream()
                                            .filter(l -> l.getDate().equals(date))
                                            .anyMatch(l -> !(finish.isBefore(l.getStart()) || start.isAfter(l.getFinish())))) {
                     throw new DomainException("L'insegnante ha già una lezione in questo orario");
              }
              Lesson l = new Lesson(date, start, finish, clients);
              l.setInstructor(instructor);
              l.setLocation(location);
              l.setDiscipline(discipline);
              lessonRepository.save(l);
       }

       public void removeLesson(int id) {
              Lesson l = lessonRepository.findById(id);
              if (l != null) {
                     lessonRepository.remove(l);
              }
       }

       public void modifyLesson(Lesson l, LocalDate newDate, LocalTime newstart, LocalTime newfinish, List<Client> newclients, Location newLocation, Discipline newDiscipline) throws IllegalArgumentException {
       if (newclients.isEmpty()) {
              throw new DomainException("At least one client is required");
       }
       if (newDiscipline == null) {
              throw new DomainException("Scegli la disciplina della lezione (sci o snowboard)");
       }
       l.setDate(newDate);
       l.setStart(newstart);
       l.setFinish(newfinish);
       l.setClients(newclients);
       l.setLocation(newLocation);
       l.setDiscipline(newDiscipline);
       lessonRepository.save(l);
       }

       public Lesson findById(int id, User instructor) {
              Lesson l = lessonRepository.findById(id);
              if (l == null || !l.getInstructor().equals(instructor)) {
              return null;
       }
       return l;
       }

       // Le lezioni di un USER sono quelle delle schede a lui collegate (il collegamento lo approva l'istruttore)
       public List<Lesson> showLessonsOf(User user) {
              List<Client> linked = clientRepository.findByAccount(user);
              if (linked.isEmpty()) {
                     return List.of();
              }
              return lessonRepository.findByClients(linked);
       }

       public record InstructorSummary(String instructorName, String instructorSurname, int lessons, double hours) {}
       public record Summary(int lessons, double hours, List<InstructorSummary> perInstructor) {}

       // Lezioni e ore già fatte dal cliente: totale e diviso per istruttore
       public Summary summaryOf(User user) {
              List<Lesson> done = showLessonsOf(user).stream()
                     .filter(Lesson::isFinished)
                     .toList();

              List<InstructorSummary> perInstructor = done.stream()
                     .collect(Collectors.groupingBy(Lesson::getInstructor))
                     .entrySet().stream()
                     .map(e -> new InstructorSummary(
                            e.getKey().getName(),
                            e.getKey().getSurname(),
                            e.getValue().size(),
                            e.getValue().stream().mapToDouble(Lesson::getDurationInHours).sum()))
                     .sorted(Comparator.comparingDouble(InstructorSummary::hours).reversed())
                     .toList();

              double totalHours = perInstructor.stream().mapToDouble(InstructorSummary::hours).sum();
              return new Summary(done.size(), totalHours, perInstructor);
       }

       // Quante lezioni già svolte ha ciascun cliente con questo istruttore: codice cliente -> numero di lezioni
       public Map<Integer, Long> finishedLessonsPerClient(User instructor) {
              return lessonRepository.findByInstructor(instructor).stream()
                     .filter(Lesson::isFinished)
                     .flatMap(l -> l.getClients().stream())
                     .collect(Collectors.groupingBy(Client::getCode, Collectors.counting()));
       }

       public List<Lesson> showLessons(User instructor) {
              return lessonRepository.findByInstructor(instructor);
       }

       

}
