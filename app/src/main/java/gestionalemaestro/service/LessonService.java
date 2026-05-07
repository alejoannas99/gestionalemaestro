package gestionalemaestro.service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;


import gestionalemaestro.model.Client;
import gestionalemaestro.model.Lesson;
import gestionalemaestro.store.LessonRepository;
import gestionalemaestro.store.ClientRepository;


import org.springframework.stereotype.Service;

@Service
public class LessonService {

       private final LessonRepository lessonRepository;
       private final ClientRepository clientRepository;

       public LessonService(LessonRepository lessonRepository, ClientRepository clientRepository) {
              this.lessonRepository = lessonRepository;
              this.clientRepository = clientRepository;
       }

       public void newLesson(LocalTime start, LocalDate date, LocalTime finish, List<Client> clients) throws IllegalArgumentException {
       boolean hasOverlap = lessonRepository.findAll().stream()
                                            .filter(l -> l.getDate().equals(date))
                                            .anyMatch(l -> l.getClients().stream()
                                                                         .anyMatch(c -> clients.contains(c)) &&!(finish.isBefore(l.getStart()) || start.isAfter(l.getFinish()))
                                          );
    
              if (hasOverlap) {
              throw new DomainException("Uno o più clienti hanno già una lezione in questo orario");
       }
              if(clients.size() == 0){
                     throw new DomainException("At least one client is required");       
              }
              else if(finish.isBefore(start) || finish.equals(start)){
                     throw new DomainException("Finish time must be after start time");
              }
              Lesson l = new Lesson(date, start, finish, clients);
              lessonRepository.save(l);
              for(Client c : clients){
                     c.attendLesson();
                     clientRepository.save(c);
              }
        
       }

       public void removeLesson(int id) {
              Lesson l = lessonRepository.findById(id);
              if (l != null) lessonRepository.remove(l);
       }     

       public void modifyLesson(Lesson l, LocalDate newDate, LocalTime newstart, LocalTime newfinish, List<Client> newclients) throws IllegalArgumentException {
              if(newclients.size() == 0){
                     throw new DomainException("At least one client is required");       
              }              
              lessonRepository.remove(l);
              Lesson modifiedLesson = new Lesson(newDate, newstart, newfinish, newclients);
              lessonRepository.save(modifiedLesson);
       }

       public Lesson findById(int id) {
              return lessonRepository.findById(id);
       }

       public List<Lesson> showLessons(){
              return lessonRepository.findAll();
       }



       

}
