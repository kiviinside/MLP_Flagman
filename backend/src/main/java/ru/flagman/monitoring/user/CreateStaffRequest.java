package ru.flagman.monitoring.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateStaffRequest(
    @NotBlank @Size(min = 3, max = 100)
    @Pattern(regexp = "^[a-zA-Z0-9._-]+$", message = "Login contains unsupported characters")
    String login,
    @NotBlank @Size(min = 12, max = 72) String password
) {}
