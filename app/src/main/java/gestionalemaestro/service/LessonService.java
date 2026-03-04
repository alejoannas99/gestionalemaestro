package gestionalemaestro.service;
import java.util.List;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.Lesson;
import gestionalemaestro.store.LessonRepository;

public class LessonService {

       private int id = 0;
       private final LessonRepository lessonRepository;

       public LessonService(LessonRepository lessonRepository) {
              this.lessonRepository = lessonRepository;
       }

       public void newLesson(String start, String date, String finish, List<Client> clients) throws IllegalArgumentException {
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

       public void modifyLesson(Lesson l, String newDate, String newstart, String newfinish, List<Client> newclients) throws IllegalArgumentException {
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

       

}
