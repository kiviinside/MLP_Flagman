CREATE TABLE IF NOT EXISTS product_stock_snapshots (
    id BIGSERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL,
    taken_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    total_quantity NUMERIC(19,3) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_stock_snapshot_product_time
    ON product_stock_snapshots (product_id, taken_at);
