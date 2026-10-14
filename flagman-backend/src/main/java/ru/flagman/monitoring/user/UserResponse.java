package ru.flagman.monitoring.user;

import java.time.LocalDateTime;

public record UserResponse(Long id, String login, UserRole role, boolean active, LocalDateTime createdAt) {
    public static UserResponse from(AppUser user) {
        return new UserResponse(user.getId(), user.getLogin(), user.getRole(), user.isActive(), user.getCreatedAt());
    }
}
