package ru.flagman.monitoring.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.flagman.monitoring.dto.StopListItemDto;
import ru.flagman.monitoring.service.StopListService;

import java.util.List;

@RestController
@RequestMapping("/api/stop-list")
@RequiredArgsConstructor
public class StopListController {
    private final StopListService stopListService;

    @GetMapping
    public List<StopListItemDto> stopList() { return stopListService.current(); }
}
