package ru.flagman.monitoring.service;

import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.flagman.monitoring.dto.MissingIngredientDto;
import ru.flagman.monitoring.dto.OrderRequest;
import ru.flagman.monitoring.dto.OrderResponse;
import ru.flagman.monitoring.exception.NotFoundException;
import ru.flagman.monitoring.model.*;
import ru.flagman.monitoring.repository.DishRepository;
import ru.flagman.monitoring.repository.OrderRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {
    private final DishRepository dishRepo;
    private final OrderRepository orderRepo;
    private final WarehouseService warehouse;
    private final StopListService stopListService;
    private final ApplicationEventPublisher events;

    /**
     * 1) блюда из стоп-листа -> отказ;
     * 2) суммируем потребность по продуктам для ВСЕГО заказа (один продукт может быть в нескольких блюдах);
     * 3) блокируем партии (порядок по productId — защита от deadlock) и проверяем остаток;
     * 4) если всего хватает — FIFO-списание, иначе заказ сохраняется как CANCELLED_OUT_OF_STOCK.
     */
    @Transactional
    public OrderResponse create(OrderRequest req) {
        LocalDateTime now = LocalDateTime.now();

        Map<Long, Integer> portions = new LinkedHashMap<>();
        req.items().forEach(i -> portions.merge(i.dishId(), i.quantity(), Integer::sum));

        Map<Long, Dish> dishes = dishRepo.findAllWithRecipeByIds(portions.keySet()).stream()
                .collect(Collectors.toMap(Dish::getId, d -> d));
        for (Long id : portions.keySet()) {
            if (!dishes.containsKey(id)) throw new NotFoundException("Блюдо не найдено: " + id);
        }

        Order order = new Order();
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setCreatedAt(now);
        portions.forEach((dishId, qty) -> {
            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setDish(dishes.get(dishId));
            oi.setQuantity(qty);
            order.getOrderItems().add(oi);
        });

        // 1. валидация стоп-листа
        String stopped = dishes.values().stream().filter(d -> !Boolean.TRUE.equals(d.getIsAvailable()))
                .map(Dish::getName).collect(Collectors.joining(", "));
        if (!stopped.isEmpty()) {
            return reject(order, "Блюда в стоп-листе: " + stopped, List.of());
        }

        // 2. потребность по продуктам
        Map<Long, BigDecimal> need = new TreeMap<>();
        Map<Long, Product> products = new HashMap<>();
        portions.forEach((dishId, qty) -> {
            for (RecipeItem ri : dishes.get(dishId).getRecipeItems()) {
                Product p = ri.getProduct();
                products.put(p.getId(), p);
                need.merge(p.getId(), ri.getRequiredQuantity().multiply(BigDecimal.valueOf(qty)), BigDecimal::add);
            }
        });

        // 3. блокировка + проверка
        Map<Long, List<Batch>> locked = new LinkedHashMap<>();
        List<MissingIngredientDto> missing = new ArrayList<>();
        need.forEach((pid, required) -> {
            List<Batch> batches = warehouse.lockFifoBatches(pid, now);
            locked.put(pid, batches);
            BigDecimal available = WarehouseService.totalRemaining(batches);
            if (available.compareTo(required) < 0) {
                Product p = products.get(pid);
                missing.add(new MissingIngredientDto(p.getName(), p.getUnit(), required, available));
            }
        });
        if (!missing.isEmpty()) {
            return reject(order, "Недостаточно ингредиентов", missing);
        }

        // 4. FIFO-списание
        need.forEach((pid, required) -> warehouse.deductFifo(locked.get(pid), required, WriteOffReason.SOLD, now));
        order.setStatus(OrderStatus.CREATED);
        orderRepo.save(order);

        stopListService.recalculate();
        events.publishEvent(new StockChangedEvent());
        return OrderResponse.of(order, List.of());
    }

    @Transactional
    public OrderResponse complete(Long orderId) {
        Order o = orderRepo.findById(orderId).orElseThrow(() -> new NotFoundException("Заказ не найден: " + orderId));
        if (o.getStatus() != OrderStatus.CREATED) {
            throw new IllegalStateException("Завершить можно только заказ в статусе CREATED");
        }
        o.setStatus(OrderStatus.COMPLETED);
        return OrderResponse.of(o, List.of());
    }

    private OrderResponse reject(Order order, String reason, List<MissingIngredientDto> missing) {
        order.setStatus(OrderStatus.CANCELLED_OUT_OF_STOCK);
        order.setRejectionReason(reason);
        orderRepo.save(order);
        stopListService.recalculate();                 // лечим возможно устаревшие флаги isAvailable
        events.publishEvent(new StockChangedEvent());
        return OrderResponse.of(order, missing);
    }
}
