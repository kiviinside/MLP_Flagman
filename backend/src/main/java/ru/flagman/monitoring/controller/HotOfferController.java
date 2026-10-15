package ru.flagman.monitoring.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.flagman.monitoring.dto.HotOfferDto;
import ru.flagman.monitoring.service.MonitoringService;

import java.util.List;

@RestController
@RequestMapping("/api/hot-offers")
@RequiredArgsConstructor
public class HotOfferController {
    private final MonitoringService monitoringService;

    @GetMapping
    public List<HotOfferDto> hotOffers() { return monitoringService.hotOffers(); }
}
