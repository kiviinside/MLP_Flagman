package ru.flagman.monitoring.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByLogin(String login);
    boolean existsByLogin(String login);
    List<AppUser> findAllByOrderByCreatedAtDesc();
}
