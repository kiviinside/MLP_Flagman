-- Выполнить один раз в PostgreSQL (Render DB) для уже существующей базы.
-- Позволяет сохранять конкретную причину вместо общего MANUAL_ADJUSTMENT.
ALTER TABLE write_off_logs DROP CONSTRAINT IF EXISTS ck_write_off_reason;
ALTER TABLE write_off_logs ADD CONSTRAINT ck_write_off_reason
  CHECK (reason IN ('EXPIRED', 'SOLD', 'MANUAL_ADJUSTMENT', 'SPOILAGE', 'KITCHEN_ERROR', 'STAFF_MEAL'));
