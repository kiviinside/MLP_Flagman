CREATE TABLE IF NOT EXISTS stock_snapshots (
    id BIGSERIAL PRIMARY KEY,
    taken_at TIMESTAMP NOT NULL,
    total_quantity NUMERIC(19,3) NOT NULL,
    expiring_quantity NUMERIC(19,3) NOT NULL,
    expired_quantity NUMERIC(19,3) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stock_snapshot_taken_at ON stock_snapshots(taken_at);
