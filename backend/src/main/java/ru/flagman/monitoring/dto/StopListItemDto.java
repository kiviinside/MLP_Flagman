package ru.flagman.monitoring.dto;

import java.util.List;

public record StopListItemDto(Long dishId, String dishName, List<String> missingIngredients) { }
