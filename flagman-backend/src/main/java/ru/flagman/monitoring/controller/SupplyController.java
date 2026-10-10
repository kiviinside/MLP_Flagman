package ru.flagman.monitoring.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.flagman.monitoring.dto.BatchDto;
import ru.flagman.monitoring.dto.SupplyRequest;
import ru.flagman.monitoring.service.SupplyService;

import java.util.List;

@RestController
@RequestMapping("/api/supplies")
@RequiredArgsConstructor
public class SupplyController {
    private final SupplyService supplyService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<BatchDto> register(@Valid @RequestBody SupplyRequest request) {
        return supplyService.receive(request);
    }
}
