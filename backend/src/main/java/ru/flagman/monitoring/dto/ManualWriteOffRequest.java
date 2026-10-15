package ru.flagman.monitoring.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import ru.flagman.monitoring.model.WriteOffReason;
import java.math.BigDecimal;

public record ManualWriteOffRequest(
        @NotNull Long productId,
        @NotNull @Positive BigDecimal quantity,
        @NotNull WriteOffReason reason
) {}
