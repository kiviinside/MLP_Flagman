package ru.flagman.monitoring.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import ru.flagman.monitoring.dto.BatchDto;
import ru.flagman.monitoring.dto.StockSummaryDto;
import ru.flagman.monitoring.model.Batch;
import ru.flagman.monitoring.model.Product;
import ru.flagman.monitoring.model.WriteOffLog;
import ru.flagman.monitoring.model.WriteOffReason;
import ru.flagman.monitoring.repository.BatchRepository;
import ru.flagman.monitoring.repository.ProductRepository;
import ru.flagman.monitoring.repository.WriteOffLogRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class WarehouseService {
    private final BatchRepository batchRepo;
    private final ProductRepository productRepo;
    private final WriteOffLogRepository logRepo;

    @Value("${app.expiring-hours:48}")
    private int expiringHours;

    @Transactional(readOnly = true)
    public List<BatchDto> batches() {
        LocalDateTime now = LocalDateTime.now();
        return batchRepo.findAllActive().stream().map(b -> BatchDto.from(b, now, expiringHours)).toList();
    }

    /** productId -> доступный (не просроченный) остаток. */
    @Transactional(readOnly = true)
    public Map<Long, BigDecimal> stockByProduct(LocalDateTime now) {
        Map<Long, BigDecimal> map = new HashMap<>();
        for (Object[] row : batchRepo.sumByProduct(now)) {
            map.put((Long) row[0], (BigDecimal) row[1]);
        }
        return map;
    }

    /** Сводка по продуктам + простая рекомендация по поставке (дозаказать до 2×minThreshold). */
    @Transactional(readOnly = true)
    public List<StockSummaryDto> summary() {
        Map<Long, BigDecimal> stock = stockByProduct(LocalDateTime.now());
        return productRepo.findAll().stream().map(p -> {
            BigDecimal available = stock.getOrDefault(p.getId(), BigDecimal.ZERO);
            boolean below = available.compareTo(p.getMinThreshold()) < 0;
            BigDecimal suggested = below
                    ? p.getMinThreshold().multiply(BigDecimal.valueOf(2)).subtract(available)
                    : BigDecimal.ZERO;
            return new StockSummaryDto(p.getId(), p.getName(), p.getUnit(), available,
                    p.getMinThreshold(), below, suggested);
        }).toList();
    }

    /** Блокирует и возвращает живые партии продукта в порядке FIFO. Вызывать внутри транзакции. */
    @Transactional(propagation = Propagation.MANDATORY)
    public List<Batch> lockFifoBatches(Long productId, LocalDateTime now) {
        return batchRepo.lockFifo(productId, now);
    }

    public static BigDecimal totalRemaining(List<Batch> batches) {
        return batches.stream().map(Batch::getRemainingQuantity).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * FIFO-списание: берём из партий с самым ранним expirationDate, пока не покроем qty.
     * Партии должны быть получены через lockFifoBatches (уже отсортированы и заблокированы).
     * Достаточность остатка проверяется вызывающим кодом.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void deductFifo(List<Batch> fifoBatches, BigDecimal qty, WriteOffReason reason, LocalDateTime now) {
        BigDecimal left = qty;
        for (Batch b : fifoBatches) {
            if (left.signum() == 0) break;
            BigDecimal take = b.getRemainingQuantity().min(left);
            b.setRemainingQuantity(b.getRemainingQuantity().subtract(take));
            left = left.subtract(take);
            logRepo.save(new WriteOffLog(b, take, now, reason));
        }
        if (left.signum() > 0) {
            throw new IllegalStateException("Недостаточно остатков для FIFO-списания");
        }
    }
}
