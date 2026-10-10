package ru.flagman.monitoring.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import ru.flagman.monitoring.dto.BatchDto;
import ru.flagman.monitoring.dto.StockSummaryDto;
import ru.flagman.monitoring.service.MonitoringService;
import ru.flagman.monitoring.service.WarehouseService;

import java.util.List;

@RestController
@RequestMapping("/api/warehouse")
@RequiredArgsConstructor
public class WarehouseController {
    private final WarehouseService warehouseService;
    private final MonitoringService monitoringService;

    /** Остатки по партиям с оставшимся сроком и статусом FRESH / EXPIRING / EXPIRED. */
    @GetMapping("/batches")
    public List<BatchDto> batches() { return warehouseService.batches(); }

    /** Сводка по продуктам + флаг ниже порога и рекомендуемый объём поставки. */
    @GetMapping("/summary")
    public List<StockSummaryDto> summary() { return warehouseService.summary(); }

    /** Партии, срок которых истекает в ближайшие N часов (по умолчанию 48). */
    @GetMapping("/expiring")
    public List<BatchDto> expiring(@RequestParam(defaultValue = "48") int hours) {
        return monitoringService.expiringBatches(hours);
    }
}
