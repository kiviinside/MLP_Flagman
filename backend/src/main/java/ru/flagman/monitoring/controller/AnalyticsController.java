package ru.flagman.monitoring.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import ru.flagman.monitoring.dto.BatchDto;
import ru.flagman.monitoring.dto.StockSummaryDto;
import ru.flagman.monitoring.service.WarehouseService;
import java.nio.charset.StandardCharsets;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import ru.flagman.monitoring.dto.WriteOffStatDto;
import ru.flagman.monitoring.model.WriteOffReason;
import ru.flagman.monitoring.service.MonitoringService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    private final MonitoringService monitoringService;
    private final WarehouseService warehouseService;

    /** Списания по продуктам и причинам; по умолчанию за последние 30 дней. */
    @GetMapping("/write-offs")
    public List<WriteOffStatDto> writeOffs(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) WriteOffReason reason) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        return monitoringService.writeOffStats(start, end, reason);
    }
    /** CSV-отчёт по текущему складу и списаниям за период; UTF-8 с BOM для Excel. */
    @GetMapping(value = "/export", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        LocalDateTime end = to != null ? to : LocalDateTime.now();
        LocalDateTime start = from != null ? from : end.minusDays(30);
        StringBuilder csv = new StringBuilder("\uFEFFРаздел;Продукт;Ед.;Количество;Причина;Срок годности\r\n");
        for (StockSummaryDto item : warehouseService.summary()) {
            csv.append("Склад;").append(cell(item.name())).append(';').append(cell(item.unit())).append(';')
                    .append(item.available()).append(";;;\r\n");
        }
        for (WriteOffStatDto item : monitoringService.writeOffStats(start, end, null)) {
            csv.append("Списание;").append(cell(item.product())).append(';').append(cell(item.unit())).append(';')
                    .append(item.totalQuantity()).append(';').append(item.reason()).append(";\r\n");
        }
        byte[] body = csv.toString().getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=warehouse-analytics.csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8)).body(body);
    }

    private static String cell(String value) {
        if (value == null) return "";
        return "\"" + value.replace("\"", "\"\"").replace("\r", " ").replace("\n", " ") + "\"";
    }
}

