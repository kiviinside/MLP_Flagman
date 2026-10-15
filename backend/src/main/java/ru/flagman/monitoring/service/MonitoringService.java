package ru.flagman.monitoring.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.flagman.monitoring.dto.BatchDto;
import ru.flagman.monitoring.dto.HotOfferDto;
import ru.flagman.monitoring.dto.WriteOffStatDto;
import ru.flagman.monitoring.model.*;
import ru.flagman.monitoring.repository.BatchRepository;
import ru.flagman.monitoring.repository.DishRepository;
import ru.flagman.monitoring.repository.WriteOffLogRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonitoringService {
    private final BatchRepository batchRepo;
    private final DishRepository dishRepo;
    private final WriteOffLogRepository logRepo;
    private final StopListService stopListService;
    private final ApplicationEventPublisher events;

    @Value("${app.expiring-hours:48}")
    private int expiringHours;
    @Value("${app.hot-horizon-hours:72}")
    private int hotHorizonHours;

    private static final int MAX_OFFERS = 10;

    // ---------- Истекающие партии ----------
    @Transactional(readOnly = true)
    public List<BatchDto> expiringBatches(int hours) {
        LocalDateTime now = LocalDateTime.now();
        return batchRepo.findActiveExpiringBefore(now.plusHours(hours)).stream()
                .map(b -> BatchDto.from(b, now, expiringHours)).toList();
    }

    // ---------- Горячие предложения ----------
    /**
     * Скоринг блюда = сумма вкладов его ингредиентов, у которых есть партии, истекающие в горизонте H:
     *   urgency = 1 - hoursLeft/H            (ближайшая к сгоранию партия; 0..1)
     *   volume  = 1 - exp(-portionsAtRisk/5) (сколько порций "горит": остаток рискованных партий / расход в техкарте,
     *                                         делённый на число доступных блюд, где продукт используется)
     *   вклад   = 100 * (0.7*urgency + 0.3*volume)
     * Итог = max вклад + 0.25 * (остальные вклады), не более 100 — блюдо с несколькими "горящими" продуктами
     * поднимается выше, но один сверхсрочный продукт всё равно важнее нескольких слабых.
     * Рекомендуемая скидка: >=70 -> 30%, >=40 -> 20%, иначе 10%. Блюда из стоп-листа не рекомендуются.
     */
    @Transactional(readOnly = true)
    public List<HotOfferDto> hotOffers() {
        LocalDateTime now = LocalDateTime.now();
        double horizon = hotHorizonHours;

        // партии отсортированы по expirationDate -> groupingBy сохраняет порядок внутри группы
        Map<Long, List<Batch>> risky = batchRepo.findActiveExpiringBefore(now.plusHours(hotHorizonHours)).stream()
                .filter(b -> b.getExpirationDate().isAfter(now))
                .collect(Collectors.groupingBy(b -> b.getProduct().getId(), LinkedHashMap::new, Collectors.toList()));
        if (risky.isEmpty()) return List.of();

        List<Dish> dishes = dishRepo.findAllWithRecipe().stream()
                .filter(d -> Boolean.TRUE.equals(d.getIsAvailable()) && !d.getRecipeItems().isEmpty())
                .toList();

        Map<Long, Integer> sharedBy = new HashMap<>();
        dishes.forEach(d -> d.getRecipeItems().forEach(ri -> sharedBy.merge(ri.getProduct().getId(), 1, Integer::sum)));

        List<HotOfferDto> result = new ArrayList<>();
        for (Dish d : dishes) {
            double max = 0, sum = 0;
            List<String> reasons = new ArrayList<>();

            for (RecipeItem ri : d.getRecipeItems()) {
                Product p = ri.getProduct();
                List<Batch> bs = risky.get(p.getId());
                if (bs == null) continue;

                Batch earliest = bs.get(0);
                double hoursLeft = Duration.between(now, earliest.getExpirationDate()).toMinutes() / 60.0;
                double urgency = clamp(1 - hoursLeft / horizon);

                BigDecimal riskQty = bs.stream().map(Batch::getRemainingQuantity).reduce(BigDecimal.ZERO, BigDecimal::add);
                double portions = riskQty.divide(ri.getRequiredQuantity(), 2, RoundingMode.HALF_UP).doubleValue();
                double perDish = portions / sharedBy.get(p.getId());
                double volume = 1 - Math.exp(-perDish / 5.0);

                double contribution = 100 * (0.7 * urgency + 0.3 * volume);
                sum += contribution;
                max = Math.max(max, contribution);
                reasons.add(String.format(Locale.ROOT,
                        "%s: %s %s истекает через %.0f ч (хватит на ~%.0f порций)",
                        p.getName(), riskQty.stripTrailingZeros().toPlainString(), p.getUnit(), hoursLeft, portions));
            }
            if (reasons.isEmpty()) continue;

            double score = Math.min(100, max + 0.25 * (sum - max));
            int discount = score >= 70 ? 30 : score >= 40 ? 20 : 10;
            result.add(new HotOfferDto(d.getId(), d.getName(), d.getPrice(),
                    Math.round(score * 10) / 10.0, discount, reasons));
        }
        result.sort(Comparator.comparingDouble(HotOfferDto::score).reversed());
        return result.size() > MAX_OFFERS ? result.subList(0, MAX_OFFERS) : result;
    }

    private static double clamp(double v) { return Math.max(0, Math.min(1, v)); }

    // ---------- Автосписание просрочки ----------
    @Scheduled(fixedDelayString = "${app.expired-check-ms:60000}")
    @Transactional
    public void writeOffExpired() {
        LocalDateTime now = LocalDateTime.now();
        List<Batch> expired = batchRepo.findActiveExpiringBefore(now);
        if (expired.isEmpty()) return;
        for (Batch b : expired) {
            BigDecimal qty = b.getRemainingQuantity();
            b.setRemainingQuantity(BigDecimal.ZERO);
            logRepo.save(new WriteOffLog(b, qty, now, WriteOffReason.EXPIRED));
            log.warn("Списана просрочка: {} {} {} (партия {}, поставка {})",
                    b.getProduct().getName(), qty, b.getProduct().getUnit(), b.getId(), b.getSupplyId());
        }
        stopListService.recalculate();
        events.publishEvent(new StockChangedEvent());
    }

    /** Горячие предложения "стареют" со временем даже без событий склада — периодически обновляем клиентов. */
    @Scheduled(fixedDelayString = "${app.hot-offers-refresh-ms:300000}")
    public void refreshClients() {
        events.publishEvent(new StockChangedEvent());
    }

    // ---------- Аналитика списаний ----------
    @Transactional(readOnly = true)
    public List<WriteOffStatDto> writeOffStats(LocalDateTime from, LocalDateTime to, WriteOffReason reason) {
        return logRepo.stats(from, to).stream()
                .filter(s -> reason == null || s.reason() == reason).toList();
    }
}
