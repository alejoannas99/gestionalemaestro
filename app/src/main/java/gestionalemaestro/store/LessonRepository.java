package gestionalemaestro.store;

import java.util.List;

import gestionalemaestro.model.Instructor;
import gestionalemaestro.model.Lesson;

public interface LessonRepository {
    void save(Lesson lesson);

    void remove(Lesson lesson);

    List<Lesson> findAll();

    Lesson findById(int id);

    List<Lesson> findByInstructor(Instructor instructor);

}
