package gestionalemaestro.store;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import gestionalemaestro.model.User;
import gestionalemaestro.model.UserPhoto;

public interface JpaUserPhotoRepository extends JpaRepository<UserPhoto, Integer> {
    Optional<UserPhoto> findByUser(User user);
}
