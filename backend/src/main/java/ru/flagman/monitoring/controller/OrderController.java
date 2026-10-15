package ru.flagman.monitoring.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import ru.flagman.monitoring.dto.OrderRequest;
import ru.flagman.monitoring.dto.OrderResponse;
import ru.flagman.monitoring.model.OrderStatus;
import ru.flagman.monitoring.service.OrderService;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    /** Список заказов для интерфейса ресторана. */
    @GetMapping
    public List<OrderResponse> findAll() { return orderService.findAll(); }

    @GetMapping("/{id}")
    public OrderResponse findById(@PathVariable Long id) { return orderService.findById(id); }

    /** 201 — заказ принят, продукты списаны по FIFO; 409 — отказ (стоп-лист / нехватка ингредиентов). */
    @PostMapping
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody OrderRequest request) {
        OrderResponse resp = orderService.create(request);
        HttpStatus status = resp.status() == OrderStatus.CREATED ? HttpStatus.CREATED : HttpStatus.CONFLICT;
        return ResponseEntity.status(status).body(resp);
    }

    @PatchMapping("/{id}/complete")
    public OrderResponse complete(@PathVariable Long id) { return orderService.complete(id); }
}
