package gestionalemaestro.store;

import org.springframework.data.jpa.repository.JpaRepository;
import gestionalemaestro.model.Instructor;
import java.util.Optional;

public interface JpaInstructorRepository extends JpaRepository<Instructor, Integer> {
    Optional<Instructor> findByEmail(String email);
}
