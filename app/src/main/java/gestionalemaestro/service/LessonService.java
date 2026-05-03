package gestionalemaestro.service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;


import gestionalemaestro.model.Client;
import gestionalemaestro.model.Lesson;
import gestionalemaestro.store.LessonRepository;


import org.springframework.stereotype.Service;

@Service
public class LessonService {

       private int id = 0;
       private final LessonRepository lessonRepository;

       public LessonService(LessonRepository lessonRepository) {
              this.lessonRepository = lessonRepository;
       }

       public void newLesson(LocalTime start, LocalDate date, LocalTime finish, List<Client> clients) throws IllegalArgumentException {
              if(clients.size() == 0){
                     throw new DomainException("At least one client is required");       
              }
              else if(finish.isBefore(start) || finish.equals(start)){
                     throw new DomainException("Finish time must be after start time");
              }
              id++; 
              Lesson l = new Lesson(id, date, start, finish, clients);
              lessonRepository.save(l);
              for(Client c : clients){
                     c.attendLesson();
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
              Lesson modifiedLesson = new Lesson(l.getId(), newDate, newstart, newfinish, newclients);
              lessonRepository.save(modifiedLesson);
       }

       public Lesson findById(int id) {
              return lessonRepository.findById(id);
       }

       public List<Lesson> showLessons(){
              return lessonRepository.findAll();
       }



       

}
