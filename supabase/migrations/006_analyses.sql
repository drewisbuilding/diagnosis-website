-- ─── analyses table ──────────────────────────────────────────────────────────
-- One record per completed diagnosis run.
-- analysis_json is the structured internal object — not the rendered report text.
-- It powers future rewrite prompts, paid tiers, and full audit flows.

CREATE TABLE IF NOT EXISTS analyses (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  url             text        NOT NULL,
  analysis_json   jsonb       NOT NULL,
  dominant_issue  text,
  core_problem    text,
  primary_blocker text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── Link submissions to their analysis ───────────────────────────────────────
-- Null until the analysis is saved (i.e. during pipeline execution).
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS analysis_id uuid REFERENCES analyses(id) ON DELETE SET NULL;

-- ─── Link rewrite requests to the analysis that generated them ────────────────
ALTER TABLE rewrite_requests
  ADD COLUMN IF NOT EXISTS analysis_id uuid REFERENCES analyses(id) ON DELETE CASCADE;

-- ─── RLS for analyses ─────────────────────────────────────────────────────────
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny_public_analyses" ON analyses
  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
