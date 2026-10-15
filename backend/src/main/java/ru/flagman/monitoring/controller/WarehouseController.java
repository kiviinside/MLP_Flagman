package ru.flagman.monitoring.controller;

import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import ru.flagman.monitoring.dto.ManualWriteOffRequest;
import ru.flagman.monitoring.model.Batch;
import ru.flagman.monitoring.model.WriteOffReason;
import ru.flagman.monitoring.model.WriteOffLog;
import ru.flagman.monitoring.repository.BatchRepository;
import ru.flagman.monitoring.repository.WriteOffLogRepository;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private final BatchRepository batchRepository;
    private final WriteOffLogRepository writeOffLogRepository;

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
    /** Ручное списание из FIFO-партий с атомарным сохранением журнала в PostgreSQL. */
    @PostMapping("/write-offs")
    @Transactional
    public java.util.Map<String, Object> writeOff(@Valid @RequestBody ManualWriteOffRequest request) {
        if (request.reason() == WriteOffReason.SOLD || request.reason() == WriteOffReason.EXPIRED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Для ручного списания укажите MANUAL_ADJUSTMENT");
        }
        LocalDateTime now = LocalDateTime.now();
        List<Batch> batches = batchRepository.lockFifo(request.productId(), now);
        BigDecimal available = batches.stream().map(Batch::getRemainingQuantity).reduce(BigDecimal.ZERO, BigDecimal::add);
        if (available.compareTo(request.quantity()) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Недостаточно доступного остатка");
        }
        BigDecimal left = request.quantity();
        int rows = 0;
        for (Batch batch : batches) {
            if (left.signum() <= 0) break;
            BigDecimal taken = batch.getRemainingQuantity().min(left);
            batch.setRemainingQuantity(batch.getRemainingQuantity().subtract(taken));
            writeOffLogRepository.save(new WriteOffLog(batch, taken, now, request.reason()));
            left = left.subtract(taken);
            rows++;
        }
        return java.util.Map.of("status", "saved", "productId", request.productId(), "quantity", request.quantity(), "reason", request.reason(), "batchesAffected", rows);
    }
}

