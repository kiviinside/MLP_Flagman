package ru.flagman.monitoring.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public final class CatalogDtos {
    private CatalogDtos() { }

    public record ProductRequest(@NotBlank String name, @NotBlank String unit,
                                 @NotNull @DecimalMin("0") BigDecimal minThreshold, Integer shelfLifeHours) { }

    public record ProductDto(Long id, String name, String unit, BigDecimal minThreshold, Integer shelfLifeHours) { }

    public record RecipeItemRequest(@NotNull Long productId, @NotNull @DecimalMin("0.001") BigDecimal requiredQuantity) { }

    public record DishRequest(@NotBlank String name, @NotNull @DecimalMin("0") BigDecimal price,
                              @NotEmpty @Valid List<RecipeItemRequest> recipe) { }

    public record RecipeLine(Long productId, String productName, BigDecimal requiredQuantity) { }

    public record DishDto(Long id, String name, BigDecimal price, boolean isAvailable, List<RecipeLine> recipe) { }
}
