package ru.flagman.monitoring.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.flagman.monitoring.dto.CatalogDtos.*;
import ru.flagman.monitoring.exception.NotFoundException;
import ru.flagman.monitoring.model.Dish;
import ru.flagman.monitoring.model.Product;
import ru.flagman.monitoring.model.RecipeItem;
import ru.flagman.monitoring.repository.DishRepository;
import ru.flagman.monitoring.repository.ProductRepository;
import ru.flagman.monitoring.repository.BatchRepository;

import java.util.List;

/** Управление номенклатурой и техкартами (ROLE_ADMIN). */
@Service
@RequiredArgsConstructor
public class CatalogService {
    private final ProductRepository productRepo;
    private final BatchRepository batchRepo;
    private final DishRepository dishRepo;
    private final StopListService stopListService;
    private final ApplicationEventPublisher events;

    @Transactional
    public ProductDto createProduct(ProductRequest r) {
        Product p = new Product();
        p.setName(r.name());
        p.setUnit(r.unit());
        p.setMinThreshold(r.minThreshold());
        p.setShelfLifeHours(r.shelfLifeHours());
        return toDto(productRepo.save(p));
    }

    @Transactional(readOnly = true)
    public List<ProductDto> products() {
        return productRepo.findAll().stream().map(this::toDto).toList();
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepo.findById(id)
                .orElseThrow(() -> new NotFoundException("Продукт не найден: " + id));
        boolean usedInRecipe = dishRepo.findAllWithRecipe().stream()
                .flatMap(d -> d.getRecipeItems().stream())
                .anyMatch(item -> item.getProduct().getId().equals(id));
        if (usedInRecipe || productHasBatches(id)) {
            throw new IllegalStateException("Нельзя удалить продукт: он связан с техкартой или историей склада");
        }
        productRepo.delete(product);
    }

    private boolean productHasBatches(Long id) {
        // Партии являются историей движения склада, поэтому продукт с партиями не удаляем.
        return batchRepositoryExists(id);
    }

    private boolean batchRepositoryExists(Long id) {
        return batchRepo.existsByProduct_Id(id);
    }

    @Transactional
    public DishDto createDish(DishRequest r) {
        Dish d = new Dish();
        d.setName(r.name());
        d.setPrice(r.price());
        for (RecipeItemRequest ri : r.recipe()) {
            Product p = productRepo.findById(ri.productId())
                    .orElseThrow(() -> new NotFoundException("Продукт не найден: " + ri.productId()));
            RecipeItem item = new RecipeItem();
            item.setDish(d);
            item.setProduct(p);
            item.setRequiredQuantity(ri.requiredQuantity());
            d.getRecipeItems().add(item);
        }
        dishRepo.save(d);
        stopListService.recalculate();
        events.publishEvent(new StockChangedEvent());
        return toDto(d);
    }

    @Transactional(readOnly = true)
    public List<DishDto> dishes() {
        return dishRepo.findAllWithRecipe().stream().map(this::toDto).toList();
    }

    private ProductDto toDto(Product p) {
        return new ProductDto(p.getId(), p.getName(), p.getUnit(), p.getMinThreshold(), p.getShelfLifeHours());
    }

    private DishDto toDto(Dish d) {
        return new DishDto(d.getId(), d.getName(), d.getPrice(), Boolean.TRUE.equals(d.getIsAvailable()),
                d.getRecipeItems().stream()
                        .map(i -> new RecipeLine(i.getProduct().getId(), i.getProduct().getName(), i.getRequiredQuantity()))
                        .toList());
    }
}
