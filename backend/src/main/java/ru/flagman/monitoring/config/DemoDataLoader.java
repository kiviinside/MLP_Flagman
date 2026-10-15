package ru.flagman.monitoring.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import ru.flagman.monitoring.dto.CatalogDtos.*;
import ru.flagman.monitoring.dto.SupplyRequest;
import ru.flagman.monitoring.repository.ProductRepository;
import ru.flagman.monitoring.service.CatalogService;
import ru.flagman.monitoring.service.SupplyService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** Демо-данные для профиля dev: продукты, блюда, две поставки с разными сроками. */
@Component
@Profile("dev")
@RequiredArgsConstructor
public class DemoDataLoader implements CommandLineRunner {
    private final ProductRepository productRepo;
    private final CatalogService catalog;
    private final SupplyService supplyService;

    @Override
    public void run(String... args) {
        if (productRepo.count() > 0) return;

        Long beef   = catalog.createProduct(new ProductRequest("Говядина", "кг", bd("2"), 72)).id();
        Long bun    = catalog.createProduct(new ProductRequest("Булочка", "шт", bd("10"), 48)).id();
        Long cheese = catalog.createProduct(new ProductRequest("Сыр", "кг", bd("1"), 120)).id();
        Long tomato = catalog.createProduct(new ProductRequest("Помидор", "кг", bd("1"), 96)).id();
        Long salad  = catalog.createProduct(new ProductRequest("Салат", "кг", bd("0.5"), 48)).id();

        catalog.createDish(new DishRequest("Бургер", bd("450"), List.of(
                new RecipeItemRequest(beef, bd("0.15")), new RecipeItemRequest(bun, bd("1")),
                new RecipeItemRequest(cheese, bd("0.03")), new RecipeItemRequest(tomato, bd("0.04")))));
        catalog.createDish(new DishRequest("Стейк", bd("890"), List.of(
                new RecipeItemRequest(beef, bd("0.3")), new RecipeItemRequest(tomato, bd("0.05")))));
        catalog.createDish(new DishRequest("Греческий салат", bd("320"), List.of(
                new RecipeItemRequest(salad, bd("0.12")), new RecipeItemRequest(tomato, bd("0.08")),
                new RecipeItemRequest(cheese, bd("0.04")))));

        LocalDateTime now = LocalDateTime.now();
        supplyService.receive(new SupplyRequest("SUP-DEMO-1", now.minusDays(2), List.of(
                new SupplyRequest.Item(beef, bd("5"), now.plusHours(20)),     // скоро сгорит
                new SupplyRequest.Item(bun, bd("40"), now.plusHours(30)),
                new SupplyRequest.Item(salad, bd("2"), now.plusHours(15)))));
        supplyService.receive(new SupplyRequest("SUP-DEMO-2", now, List.of(
                new SupplyRequest.Item(beef, bd("8"), null),                  // срок = now + 72 ч
                new SupplyRequest.Item(cheese, bd("3"), null),
                new SupplyRequest.Item(tomato, bd("4"), null))));
    }

    private static BigDecimal bd(String v) { return new BigDecimal(v); }
}
