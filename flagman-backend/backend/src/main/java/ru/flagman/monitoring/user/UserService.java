package ru.flagman.monitoring.user;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class UserService {
    private final AppUserRepository repository;
    private final PasswordEncoder passwordEncoder;
    public UserService(AppUserRepository repository, PasswordEncoder passwordEncoder) {
        this.repository = repository; this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse createStaff(CreateStaffRequest request) {
        String login = request.login().trim();
        if (repository.existsByLogin(login)) throw new ResponseStatusException(HttpStatus.CONFLICT, "Login already exists");
        AppUser user = new AppUser(login, passwordEncoder.encode(request.password()), UserRole.STAFF);
        try { return UserResponse.from(repository.saveAndFlush(user)); }
        catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Login already exists");
        }
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getUsers() {
        return repository.findAllByOrderByCreatedAtDesc().stream().map(UserResponse::from).toList();
    }
}
