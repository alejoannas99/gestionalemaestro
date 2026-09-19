package gestionalemaestro.store;

import org.springframework.data.jpa.repository.JpaRepository;

import gestionalemaestro.model.User;
import gestionalemaestro.model.Lesson;
import gestionalemaestro.model.Client;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface JpaLessonRepository extends JpaRepository<Lesson, Integer> {
    List<Lesson> findByDate(LocalDate date);
    List<Lesson> findByInstructor(User instructor);
    List<Lesson> findDistinctByClientsIn(Collection<Client> clients);
}
