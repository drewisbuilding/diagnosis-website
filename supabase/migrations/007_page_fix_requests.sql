-- ─── page_fix_requests table ────────────────────────────────────────────────
-- Stores intent from the "Request a rewrite" tertiary CTA flow.
-- Separate from rewrite_requests (which is the email capture for the Fix Plan).
-- This table captures higher-intent users who want done-for-you help.

CREATE TABLE IF NOT EXISTS page_fix_requests (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  url            text        NOT NULL,
  email          text        NOT NULL,
  goal           text        NOT NULL,
  notes          text,
  analysis_id    uuid        REFERENCES analyses(id) ON DELETE SET NULL,
  payment_intent boolean     NOT NULL DEFAULT false,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE page_fix_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_public_page_fix_requests" ON page_fix_requests
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
