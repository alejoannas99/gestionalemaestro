package gestionalemaestro.store;

import org.springframework.data.jpa.repository.JpaRepository;
import gestionalemaestro.model.Lesson;
import java.time.LocalDate;
import java.util.List;

public interface JpaLessonRepository extends JpaRepository<Lesson, Integer> {
    List<Lesson> findByDate(LocalDate date);
}
