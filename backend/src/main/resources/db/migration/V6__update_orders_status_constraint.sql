-- Разрешаем все статусы, объявленные в OrderStatus.java.
ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS ck_orders_status;

ALTER TABLE orders
    ADD CONSTRAINT ck_orders_status
    CHECK (
        status IN (
            'CREATED',
            'READY',
            'RECEIVED_BY_VISITOR',
            'PAID',
            'COMPLETED',
            'CANCELLED_OUT_OF_STOCK'
        )
    );