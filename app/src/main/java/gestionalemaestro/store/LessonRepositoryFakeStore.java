package gestionalemaestro.store;
import java.util.List;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.User;
import gestionalemaestro.model.Lesson;

import org.springframework.stereotype.Repository;

@Repository
public class LessonRepositoryFakeStore implements LessonRepository {
    
    public void save(Lesson lesson) {
        FakeStore.lessons.add(lesson);
    }   

    public void remove(Lesson lesson){
        FakeStore.lessons.remove(lesson);
    }

    public List<Lesson> findAll(){
        return List.copyOf(FakeStore.lessons);
    }

    public Lesson findById(int id){
        return FakeStore.lessons.stream()
                                  .filter(l -> l.getId() == id)
                                  .findFirst()
                                  .orElse(null);
    }

    public List<Lesson> findByInstructor(User instructor) {
        return FakeStore.lessons.stream()
            .filter(l -> l.getInstructor().equals(instructor))
            .toList();
    }

    public List<Lesson> findByClients(List<Client> clients) {
        return FakeStore.lessons.stream()
            .filter(l -> l.getClients().stream().anyMatch(clients::contains))
            .toList();
    }



    

}
