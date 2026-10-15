package ru.flagman.monitoring.dto;

import java.math.BigDecimal;

public record StockSummaryDto(Long productId, String name, String unit, BigDecimal available,
                              BigDecimal minThreshold, boolean belowThreshold, BigDecimal suggestedSupply) { }
