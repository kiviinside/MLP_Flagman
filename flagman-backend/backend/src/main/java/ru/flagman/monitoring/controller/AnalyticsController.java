package ru.flagman.monitoring.controller;

import lombok.RequiredArgsConstructor;
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
}
