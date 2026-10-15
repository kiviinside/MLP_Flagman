package ru.flagman.monitoring.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import ru.flagman.monitoring.dto.SupplyRequest;
import ru.flagman.monitoring.dto.SupplySummaryDto;
import ru.flagman.monitoring.dto.BatchDto;
import ru.flagman.monitoring.repository.BatchRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.stream.Collectors;
import ru.flagman.monitoring.service.SupplyService;

import java.util.List;

@RestController
@RequestMapping("/api/supplies")
@RequiredArgsConstructor
public class SupplyController {
    private final SupplyService supplyService;
    private final BatchRepository batchRepository;

    /** История агрегируется по supplyId из уже существующих партий. */
    @GetMapping
    public List<SupplySummaryDto> history() {
        return batchRepository.findAllForSupplyHistory().stream()
                .collect(Collectors.groupingBy(b -> b.getSupplyId()))
                .entrySet().stream()
                .map(entry -> {
                    var batches = entry.getValue();
                    var date = batches.stream().map(b -> b.getSupplyDate())
                            .min(Comparator.naturalOrder()).orElse(null);
                    var quantity = batches.stream().map(b -> b.getQuantity())
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new SupplySummaryDto(entry.getKey(), date, batches.size(), quantity, "RECEIVED");
                })
                .sorted(Comparator.comparing(SupplySummaryDto::createdAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public List<BatchDto> register(@Valid @RequestBody SupplyRequest request) {
        return supplyService.receive(request);
    }
}
