package gestionalemaestro.store;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import gestionalemaestro.model.User;
import gestionalemaestro.model.UserSettings;

public interface JpaUserSettingsRepository extends JpaRepository<UserSettings, Integer> {
    Optional<UserSettings> findByUser(User user);
}
