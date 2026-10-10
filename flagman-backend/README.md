# Флагман: мониторинг остатков, сроков годности и стоп-листов

Spring Boot 3.3 · Java 17 · JPA (H2 для dev / PostgreSQL для prod) · Spring Security (Basic, ROLE_ADMIN / ROLE_STAFF) · SSE

## Запуск
```bash
mvn spring-boot:run          # профиль dev: H2 in-memory + демо-данные
# admin / admin123, staff / staff123 (переопределяются ADMIN_PASSWORD / STAFF_PASSWORD)
```

## Структура
```
ru.flagman.monitoring
├── model        Product, Batch, Dish, RecipeItem, Order, OrderItem, WriteOffLog (+ enum'ы)
├── repository   Spring Data JPA; lockFifo(...) — PESSIMISTIC_WRITE + ORDER BY expirationDate
├── dto          records запросов/ответов
├── service      SupplyService, WarehouseService (FIFO), OrderService, StopListService,
│                MonitoringService (hot offers, автосписание), SseHub, CatalogService
├── controller   REST + SSE
├── config       SecurityConfig, DemoDataLoader
└── exception    GlobalExceptionHandler (ProblemDetail)
```

## API
| Метод | Путь | Роль |
|---|---|---|
| POST | /api/supplies | ADMIN |
| GET | /api/warehouse/batches · /summary · /expiring?hours=48 | STAFF, ADMIN |
| POST | /api/orders · PATCH /api/orders/{id}/complete | STAFF, ADMIN |
| GET | /api/stop-list · /api/hot-offers | STAFF, ADMIN |
| GET | /api/events/stream (SSE, событие `stock-update`) | STAFF, ADMIN |
| GET | /api/analytics/write-offs?from&to&reason | ADMIN |
| GET/POST | /api/admin/products · /api/admin/dishes | ADMIN |

```bash
curl -u admin:admin123 localhost:8080/api/hot-offers
curl -u staff:staff123 -H 'Content-Type: application/json' \
     -d '{"items":[{"dishId":1,"quantity":2}]}' localhost:8080/api/orders
curl -N -u staff:staff123 localhost:8080/api/events/stream
```

## Ключевые решения
* **FIFO**: партии продукта берутся по `expirationDate ASC, supplyDate ASC`; просроченные не участвуют.
  Каждое списание пишется в `WriteOffLog` (reason = SOLD), просрочка — EXPIRED.
* **Атомарность заказа**: потребность суммируется по продуктам на весь заказ (один продукт может быть
  в нескольких блюдах), строки партий блокируются в порядке `productId` (нет deadlock), всё в одной транзакции.
* **Отказ**: заказ сохраняется со статусом `CANCELLED_OUT_OF_STOCK`, ответ 409 со списком недостающих ингредиентов.
* **Стоп-лист**: `Dish.isAvailable` пересчитывается при поставке, заказе, автосписании и создании блюда.
* **Горячие предложения**: см. javadoc `MonitoringService.hotOffers()` — urgency (0.7) + объём «горящих» порций (0.3),
  делёж остатка между блюдами, объяснение причины в `reasons`, рекомендуемая скидка.
* **SSE** рассылается после коммита (`@TransactionalEventListener` + `@Async`) и по таймеру (горячие предложения «стареют»).

## Отступления от ТЗ (осознанные)
* `Product.shelfLifeHours` — нужен для «автоматического расчёта срока годности»; если `expirationDate` в поставке не указана, считается `supplyDate + shelfLifeHours`.
* `Order.rejectionReason` — причина отказа для UI.
* Статус `CANCELLED_OUT_OF_STOCK` (в тексте ТЗ встречаются оба написания CANCELED/CANCELLED).

## Что добавить дальше
Flyway-миграции, JWT вместо Basic (EventSource в браузере не умеет заголовки), Testcontainers-тесты на гонки заказов,
Micrometer + Prometheus → Grafana, прогноз времени до стоп-листа (скорость расхода по `WriteOffLog` SOLD),
генератор поставок/заказов (`@Scheduled` под профилем `sim`), ручное списание (`MANUAL_ADJUSTMENT`).
