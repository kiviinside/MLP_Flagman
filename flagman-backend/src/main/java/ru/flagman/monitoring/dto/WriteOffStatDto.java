package ru.flagman.monitoring.dto;

import ru.flagman.monitoring.model.WriteOffReason;

import java.math.BigDecimal;

public record WriteOffStatDto(String product, String unit, WriteOffReason reason, BigDecimal totalQuantity) { }
