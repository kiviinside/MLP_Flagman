package ru.flagman.monitoring.dto;

import ru.flagman.monitoring.model.Order;
import ru.flagman.monitoring.model.OrderStatus;

import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(Long id, String orderNumber, OrderStatus status, LocalDateTime createdAt,
                            String rejectionReason, List<Line> items, List<MissingIngredientDto> missingIngredients) {
    public record Line(Long dishId, String dishName, int quantity) { }

    public static OrderResponse of(Order o, List<MissingIngredientDto> missing) {
        List<Line> lines = o.getOrderItems().stream()
                .map(i -> new Line(i.getDish().getId(), i.getDish().getName(), i.getQuantity())).toList();
        return new OrderResponse(o.getId(), o.getOrderNumber(), o.getStatus(), o.getCreatedAt(),
                o.getRejectionReason(), lines, missing);
    }
}
