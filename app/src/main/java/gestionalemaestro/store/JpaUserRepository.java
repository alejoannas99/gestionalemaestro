package gestionalemaestro.store;

import gestionalemaestro.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface JpaUserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    List<User> findByRole(User.Role role);
    List<User> findByRoleAndApprovedFalse(User.Role role);
    List<User> findByRoleAndApprovedTrue(User.Role role);
    long countByRole(User.Role role);
    long countByRoleAndApprovedTrue(User.Role role);
    long countByRoleAndApprovedFalse(User.Role role);
}
