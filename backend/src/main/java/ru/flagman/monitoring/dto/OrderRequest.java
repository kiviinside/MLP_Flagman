package ru.flagman.monitoring.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record OrderRequest(@NotEmpty @Valid List<Item> items) {
    public record Item(@NotNull Long dishId, @Min(1) int quantity) { }
}
