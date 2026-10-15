package ru.flagman.monitoring.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** supplyNumber и createdAt необязательны; expirationDate необязательна, если у продукта задан shelfLifeHours. */
public record SupplyRequest(String supplyNumber, LocalDateTime createdAt, @NotEmpty @Valid List<Item> items) {
    public record Item(@NotNull Long productId,
                       @NotNull @DecimalMin("0.001") BigDecimal quantity,
                       LocalDateTime expirationDate) { }
}
