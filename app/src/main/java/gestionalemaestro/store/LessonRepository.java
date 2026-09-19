package gestionalemaestro.store;

import java.util.List;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.User;
import gestionalemaestro.model.Lesson;

public interface LessonRepository {
    void save(Lesson lesson);

    void remove(Lesson lesson);

    List<Lesson> findAll();

    Lesson findById(int id);

    List<Lesson> findByInstructor(User instructor);

    List<Lesson> findByClients(List<Client> clients);

}
