package ru.flagman.monitoring.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.flagman.monitoring.dto.DashboardDto;
import ru.flagman.monitoring.model.OrderStatus;
import ru.flagman.monitoring.repository.DishRepository;
import ru.flagman.monitoring.repository.OrderRepository;
import ru.flagman.monitoring.repository.ProductRepository;
import ru.flagman.monitoring.service.WarehouseService;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {
    private final ProductRepository productRepository;
    private final DishRepository dishRepository;
    private final OrderRepository orderRepository;
    private final WarehouseService warehouseService;

    @GetMapping
    public DashboardDto dashboard() {
        var batches = warehouseService.batches();
        long expiring = batches.stream().filter(b -> b.expirationDate() != null
                && !b.expirationDate().isBefore(LocalDateTime.now())
                && b.hoursLeft() <= 48 && b.remainingQuantity().signum() > 0).count();
        long expired = batches.stream().filter(b -> b.status().name().equals("EXPIRED")
                && b.remainingQuantity().signum() > 0).count();
        var dishes = dishRepository.findAllWithRecipe();
        long activeOrders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.CREATED).count();
        return new DashboardDto(productRepository.count(), expiring, expired,
                dishes.stream().filter(d -> Boolean.TRUE.equals(d.getIsAvailable())).count(),
                dishes.size(), activeOrders);
    }
}
