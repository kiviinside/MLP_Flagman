package ru.flagman.monitoring.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.flagman.monitoring.dto.BatchDto;
import ru.flagman.monitoring.dto.SupplyRequest;
import ru.flagman.monitoring.exception.NotFoundException;
import ru.flagman.monitoring.model.Batch;
import ru.flagman.monitoring.model.Product;
import ru.flagman.monitoring.repository.BatchRepository;
import ru.flagman.monitoring.repository.ProductRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SupplyService {
    private final ProductRepository productRepo;
    private final BatchRepository batchRepo;
    private final StopListService stopListService;
    private final ApplicationEventPublisher events;

    @Value("${app.expiring-hours:48}")
    private int expiringHours;

    /** Принимает поставку: каждая позиция становится отдельной партией (Batch). */
    @Transactional
    public List<BatchDto> receive(SupplyRequest req) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime supplyDate = req.createdAt() != null ? req.createdAt() : now;
        String supplyId = (req.supplyNumber() != null && !req.supplyNumber().isBlank())
                ? req.supplyNumber()
                : "SUP-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        List<Batch> saved = new ArrayList<>();
        for (SupplyRequest.Item item : req.items()) {
            Product p = productRepo.findById(item.productId())
                    .orElseThrow(() -> new NotFoundException("Продукт не найден: " + item.productId()));

            Batch b = new Batch();
            b.setSupplyId(supplyId);
            b.setProduct(p);
            b.setQuantity(item.quantity());
            b.setRemainingQuantity(item.quantity());
            b.setSupplyDate(supplyDate);
            b.setExpirationDate(resolveExpiration(item, p, supplyDate));
            saved.add(batchRepo.save(b));
        }
        stopListService.recalculate();          // новые остатки могут вывести блюда из стоп-листа
        events.publishEvent(new StockChangedEvent());
        return saved.stream().map(b -> BatchDto.from(b, now, expiringHours)).toList();
    }

    /** Срок годности: явно указанный в поставке, иначе supplyDate + shelfLifeHours продукта. */
    private LocalDateTime resolveExpiration(SupplyRequest.Item item, Product p, LocalDateTime supplyDate) {
        LocalDateTime exp = item.expirationDate();
        if (exp == null) {
            if (p.getShelfLifeHours() == null) {
                throw new IllegalArgumentException("Для продукта '" + p.getName()
                        + "' не задан shelfLifeHours — укажите expirationDate в поставке");
            }
            exp = supplyDate.plusHours(p.getShelfLifeHours());
        }
        if (!exp.isAfter(supplyDate)) {
            throw new IllegalArgumentException("Срок годности раньше даты поступления: " + p.getName());
        }
        return exp;
    }
}
