package gestionalemaestro.store;

import java.util.List;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import gestionalemaestro.model.Client;
import gestionalemaestro.model.User;
import gestionalemaestro.model.Lesson;

@Repository
@Primary
public class DbLessonRepository implements LessonRepository {

    private final JpaLessonRepository jpa;

    public DbLessonRepository(JpaLessonRepository jpa) {
        this.jpa = jpa;
    }

    public void save(Lesson lesson) {
        jpa.save(lesson);
    }

    public void remove(Lesson lesson) {
        jpa.delete(lesson);
    }

    public List<Lesson> findAll() {
        return jpa.findAll();
    }

    public Lesson findById(int id) {
        return jpa.findById(id).orElse(null);
    }

    public List<Lesson> findByInstructor(User instructor) {
        return jpa.findByInstructor(instructor);
    }

    public List<Lesson> findByClients(List<Client> clients) {
        return jpa.findDistinctByClientsIn(clients);
    }
}
