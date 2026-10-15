package ru.flagman.monitoring.service;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import ru.flagman.monitoring.dto.StockUpdateDto;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/** SSE-рассылка актуального стоп-листа, горячих предложений и остатков. Событие "stock-update". */
@Component
@RequiredArgsConstructor
public class SseHub {
    private final List<SseEmitter> emitters = new CopyOnWriteArrayList<>();
    private final StopListService stopListService;
    private final MonitoringService monitoringService;
    private final WarehouseService warehouseService;

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(0L);   // без таймаута
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        emitter.onError(t -> emitters.remove(emitter));
        return emitter;
    }

    /** После коммита транзакции (или сразу, если транзакции нет) — в отдельном потоке. */
    @Async
    @TransactionalEventListener(fallbackExecution = true)
    public void onStockChanged(StockChangedEvent event) {
        if (emitters.isEmpty()) return;
        StockUpdateDto payload = new StockUpdateDto(
                stopListService.current(), monitoringService.hotOffers(), warehouseService.summary());
        for (SseEmitter e : emitters) {
            try {
                e.send(SseEmitter.event().name("stock-update").data(payload));
            } catch (Exception ex) {
                emitters.remove(e);
            }
        }
    }
}
