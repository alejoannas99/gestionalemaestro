package gestionalemaestro.service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;


import gestionalemaestro.model.Client;
import gestionalemaestro.model.Lesson;
import gestionalemaestro.store.LessonRepository;
import gestionalemaestro.store.ClientRepository;
import gestionalemaestro.model.Instructor;


import org.springframework.stereotype.Service;

@Service
public class LessonService {

       private final LessonRepository lessonRepository;
       private final ClientRepository clientRepository;

       public LessonService(LessonRepository lessonRepository, ClientRepository clientRepository) {
              this.lessonRepository = lessonRepository;
              this.clientRepository = clientRepository;
       }

       public void newLesson(LocalTime start, LocalDate date, LocalTime finish, List<Client> clients, Instructor instructor) throws IllegalArgumentException {
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
       l.setDate(newDate);
       l.setStart(newstart);
       l.setFinish(newfinish);
       l.setClients(newclients);
       lessonRepository.save(l);
       }

       public Lesson findById(int id, Instructor instructor) {
              Lesson l = lessonRepository.findById(id);
              if (l == null || !l.getInstructor().equals(instructor)) {
              return null;
       }
       return l;
       }

       public List<Lesson> showLessons(Instructor instructor) {
              return lessonRepository.findByInstructor(instructor);
       }

       

}
