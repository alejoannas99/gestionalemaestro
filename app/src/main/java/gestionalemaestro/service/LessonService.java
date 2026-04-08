package gestionalemaestro.service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.Lesson;
import gestionalemaestro.store.LessonRepository;

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
              id++; 
              Lesson l = new Lesson(id, date, start, finish, clients);
              lessonRepository.save(l);
              for(Client c : clients){
                     c.attendLesson();
              }
        
       }

       public void removeLesson(int id){
              lessonRepository.findAll().stream()
                     .filter(l -> l.getId() == id)
                     .findFirst()
                     .ifPresent(l -> lessonRepository.remove(l));
       }      

       public void modifyLesson(Lesson l, LocalDate newDate, LocalTime newstart, LocalTime newfinish, List<Client> newclients) throws IllegalArgumentException {
              if(newclients.size() == 0){
                     throw new DomainException("At least one client is required");       
              }              
              lessonRepository.remove(l);
              Lesson modifiedLesson = new Lesson(l.getId(), newDate, newstart, newfinish, newclients);
              lessonRepository.save(modifiedLesson);
       }

       public List<Lesson> showLessons(){
              return lessonRepository.findAll();
       }

       public int amountOfLessons(){
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

       

}
