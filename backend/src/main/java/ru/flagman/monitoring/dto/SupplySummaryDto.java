package ru.flagman.monitoring.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Сводка по поставке, агрегированная из поступивших складских партий. */
public record SupplySummaryDto(
        String supplyId, LocalDateTime createdAt, int itemCount, BigDecimal totalQuantity, String status) { }
