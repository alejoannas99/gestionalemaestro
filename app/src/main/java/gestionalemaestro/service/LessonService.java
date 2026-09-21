package gestionalemaestro.service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;


import gestionalemaestro.model.Client;
import gestionalemaestro.model.Lesson;
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

       public void newLesson(LocalTime start, LocalDate date, LocalTime finish, List<Client> clients, User instructor) throws IllegalArgumentException {
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
              else if(lessonRepository.findByInstructor(instructor).stream()
                                            .filter(l -> l.getDate().equals(date))
                                            .anyMatch(l -> !(finish.isBefore(l.getStart()) || start.isAfter(l.getFinish())))) {
                     throw new DomainException("L'insegnante ha già una lezione in questo orario");
              }
              Lesson l = new Lesson(date, start, finish, clients);
              l.setInstructor(instructor);
              lessonRepository.save(l);
              for(Client c : clients){
                     c.attendLesson();
                     clientRepository.save(c);
              }
        
       }

       public void removeLesson(int id) {
              Lesson l = lessonRepository.findById(id);
              if (l != null) {
              // decrementa lessonsAttended per ogni cliente della lezione
              for (Client c : l.getClients()) {
                     if (c.getLessonsAttended() > 0) {
                     c.decrementLesson();
                     clientRepository.save(c);
              }
              }
              lessonRepository.remove(l);
       }
       }    

       public void modifyLesson(Lesson l, LocalDate newDate, LocalTime newstart, LocalTime newfinish, List<Client> newclients) throws IllegalArgumentException {
       if (newclients.isEmpty()) {
              throw new DomainException("At least one client is required");
       }
       List<Client> oldClients = List.copyOf(l.getClients());
       for (Client c : oldClients) {
              if (!newclients.contains(c) && c.getLessonsAttended() > 0) {
                     c.decrementLesson();
                     clientRepository.save(c);
              }
       }
       for (Client c : newclients) {
              if (!oldClients.contains(c)) {
                     c.attendLesson();
                     clientRepository.save(c);
              }
       }
       l.setDate(newDate);
       l.setStart(newstart);
       l.setFinish(newfinish);
       l.setClients(newclients);
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
              LocalDateTime now = LocalDateTime.now();
              List<Lesson> done = showLessonsOf(user).stream()
                     .filter(l -> LocalDateTime.of(l.getDate(), l.getFinish()).isBefore(now))
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

       public List<Lesson> showLessons(User instructor) {
              return lessonRepository.findByInstructor(instructor);
       }

       

}
