package ru.flagman.monitoring.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.flagman.monitoring.dto.StopListItemDto;
import ru.flagman.monitoring.model.Dish;
import ru.flagman.monitoring.model.RecipeItem;
import ru.flagman.monitoring.repository.DishRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class StopListService {
    private final DishRepository dishRepo;
    private final WarehouseService warehouse;

    /**
     * Пересчитывает isAvailable для всех блюд: блюдо доступно, если на складе (без просрочки)
     * хватает каждого ингредиента хотя бы на одну порцию. Для небольшого ресторана пересчёт
     * всех блюд дёшев; при росте каталога — пересчитывать только блюда затронутых продуктов.
     */
    @Transactional
    public void recalculate() {
        Map<Long, BigDecimal> stock = warehouse.stockByProduct(LocalDateTime.now());
        for (Dish d : dishRepo.findAllWithRecipe()) {
            boolean available = missing(d, stock).isEmpty();
            if (!Boolean.valueOf(available).equals(d.getIsAvailable())) {
                d.setIsAvailable(available);
            }
        }
    }

    @Transactional(readOnly = true)
    public List<StopListItemDto> current() {
        Map<Long, BigDecimal> stock = warehouse.stockByProduct(LocalDateTime.now());
        return dishRepo.findAllWithRecipe().stream()
                .filter(d -> !Boolean.TRUE.equals(d.getIsAvailable()))
                .map(d -> new StopListItemDto(d.getId(), d.getName(), missing(d, stock)))
                .toList();
    }

    private List<String> missing(Dish d, Map<Long, BigDecimal> stock) {
        return d.getRecipeItems().stream()
                .filter((RecipeItem ri) -> stock.getOrDefault(ri.getProduct().getId(), BigDecimal.ZERO)
                        .compareTo(ri.getRequiredQuantity()) < 0)
                .map(ri -> ri.getProduct().getName())
                .toList();
    }
}
