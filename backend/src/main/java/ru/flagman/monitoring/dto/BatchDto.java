package ru.flagman.monitoring.dto;

import ru.flagman.monitoring.model.Batch;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;

public record BatchDto(Long id, String supplyId, Long productId, String productName, String unit,
                       BigDecimal quantity, BigDecimal remainingQuantity,
                       LocalDateTime supplyDate, LocalDateTime expirationDate,
                       long hoursLeft, ExpirationStatus status) {

    public static BatchDto from(Batch b, LocalDateTime now, int expiringHours) {
        long hours = Duration.between(now, b.getExpirationDate()).toHours();
        ExpirationStatus st = b.getExpirationDate().isBefore(now) ? ExpirationStatus.EXPIRED
                : hours < expiringHours ? ExpirationStatus.EXPIRING : ExpirationStatus.FRESH;
        return new BatchDto(b.getId(), b.getSupplyId(), b.getProduct().getId(), b.getProduct().getName(),
                b.getProduct().getUnit(), b.getQuantity(), b.getRemainingQuantity(),
                b.getSupplyDate(), b.getExpirationDate(), hours, st);
    }
}
