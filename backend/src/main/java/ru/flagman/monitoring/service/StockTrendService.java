package ru.flagman.monitoring.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.flagman.monitoring.model.Batch;
import ru.flagman.monitoring.model.StockSnapshot;
import ru.flagman.monitoring.model.WriteOffLog;
import ru.flagman.monitoring.repository.BatchRepository;
import ru.flagman.monitoring.repository.StockSnapshotRepository;
import ru.flagman.monitoring.repository.WriteOffLogRepository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StockTrendService {
    private static final int RETENTION_SNAPSHOTS = 8640; // около 30 дней при интервале 5 минут
    private static final BigDecimal ZERO = BigDecimal.ZERO;

    private final WarehouseService warehouseService;
    private final BatchRepository batches;
    private final StockSnapshotRepository snapshots;
    private final WriteOffLogRepository writeOffLogs;

    @Scheduled(
        fixedDelayString = "${app.stock-trend.interval-ms:300000}",
        initialDelayString = "${app.stock-trend.initial-delay-ms:10000}"
    )
    @Transactional
    public void capture() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime last = snapshots.latestTime();
        if (last != null && last.isAfter(now.minusMinutes(4))) return;

        BigDecimal total = warehouseService.summary().stream()
            .map(x -> x.available())
            .reduce(ZERO, BigDecimal::add);

        BigDecimal expiring = ZERO;
        BigDecimal expired = ZERO;
        for (var batch : batches.findAllActive()) {
            if (batch.getExpirationDate().isBefore(now)) {
                expired = expired.add(batch.getRemainingQuantity());
            } else if (!batch.getExpirationDate().isAfter(now.plusHours(48))) {
                expiring = expiring.add(batch.getRemainingQuantity());
            }
        }

        snapshots.save(new StockSnapshot(now, total, expiring, expired));

        List<StockSnapshot> all = snapshots.findAllByOrderByTakenAtAsc();
        if (all.size() > RETENTION_SNAPSHOTS) {
            snapshots.deleteAll(all.subList(0, all.size() - RETENTION_SNAPSHOTS));
        }
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> history() {
        List<StockSnapshot> rows = new ArrayList<>(snapshots.findTop8640ByOrderByTakenAtDesc());
        Collections.reverse(rows);

        // Actual receipt events: original quantity of each received batch.
        List<Batch> received = batches.findAllByOrderBySupplyDateAsc();
        // Actual write-off events include sold, expired and manually adjusted quantities.
        List<WriteOffLog> used = writeOffLogs.findAllByOrderByWriteOffDateAsc();

        Deque<FlowEvent> receiptWindow = new ArrayDeque<>();
        Deque<FlowEvent> usedWindow = new ArrayDeque<>();
        int receiptIndex = 0;
        int usedIndex = 0;
        BigDecimal receiptSum = ZERO;
        BigDecimal usedSum = ZERO;
        List<Map<String, Object>> result = new ArrayList<>(rows.size());

        for (StockSnapshot snapshot : rows) {
            LocalDateTime at = snapshot.getTakenAt();
            LocalDateTime windowStart = at.minusHours(24);

            while (receiptIndex < received.size()
                    && !received.get(receiptIndex).getSupplyDate().isAfter(at)) {
                Batch batch = received.get(receiptIndex++);
                receiptWindow.addLast(new FlowEvent(batch.getSupplyDate(), batch.getQuantity()));
                receiptSum = receiptSum.add(batch.getQuantity());
            }
            while (!receiptWindow.isEmpty() && receiptWindow.peekFirst().at().isBefore(windowStart)) {
                receiptSum = receiptSum.subtract(receiptWindow.removeFirst().quantity());
            }

            while (usedIndex < used.size()
                    && !used.get(usedIndex).getWriteOffDate().isAfter(at)) {
                WriteOffLog log = used.get(usedIndex++);
                usedWindow.addLast(new FlowEvent(log.getWriteOffDate(), log.getQuantity()));
                usedSum = usedSum.add(log.getQuantity());
            }
            while (!usedWindow.isEmpty() && usedWindow.peekFirst().at().isBefore(windowStart)) {
                usedSum = usedSum.subtract(usedWindow.removeFirst().quantity());
            }

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("timestamp", at);
            item.put("totalQuantity", snapshot.getTotalQuantity());
            // Trailing 24-hour sums, aligned with each stock snapshot.
            item.put("received24h", receiptSum);
            item.put("used24h", usedSum);
            result.add(item);
        }
        return result;
    }

    private record FlowEvent(LocalDateTime at, BigDecimal quantity) {}
}
