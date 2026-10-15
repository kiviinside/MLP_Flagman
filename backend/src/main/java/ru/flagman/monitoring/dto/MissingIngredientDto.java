package ru.flagman.monitoring.dto;

import java.math.BigDecimal;

public record MissingIngredientDto(String product, String unit, BigDecimal required, BigDecimal available) { }
