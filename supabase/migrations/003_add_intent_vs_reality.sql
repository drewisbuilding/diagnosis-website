-- ─── Intent vs Reality — Migration 003 ───────────────────────────────────────
-- Adds intent_vs_reality to reports. Run after migration 001 or 002.

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS intent_vs_reality JSONB;
