-- Stores email capture submissions from the "Get the exact rewrite" CTA
CREATE TABLE IF NOT EXISTS rewrite_requests (
  id          BIGSERIAL PRIMARY KEY,
  email       TEXT        NOT NULL,
  url         TEXT        NOT NULL,
  wants_full_report BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
