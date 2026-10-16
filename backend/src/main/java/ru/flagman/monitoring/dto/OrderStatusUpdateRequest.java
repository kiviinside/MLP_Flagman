package ru.flagman.monitoring.dto;

import jakarta.validation.constraints.NotNull;
import ru.flagman.monitoring.model.OrderStatus;

public record OrderStatusUpdateRequest(@NotNull OrderStatus status) {
}
