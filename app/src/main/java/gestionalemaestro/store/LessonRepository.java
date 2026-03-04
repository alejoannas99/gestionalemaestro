package gestionalemaestro.store;
import java.util.List;

import gestionalemaestro.model.Lesson;

public class LessonRepository {
    
    public void save(Lesson lesson) {
        FakeStore.lessons.add(lesson);
    }   

    public void remove(Lesson lesson){
        FakeStore.lessons.remove(lesson);
    }

    public List<Lesson> findAll(){
        return List.copyOf(FakeStore.lessons);
    }



    

}
