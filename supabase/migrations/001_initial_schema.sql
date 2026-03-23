-- ─── Conversion Diagnosis Engine — Initial Schema ────────────────────────────

-- Submissions: tracks each URL analysis request
CREATE TABLE submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url            TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'scraping', 'diagnosing', 'complete', 'failed')),
  error          TEXT,
  page_type      TEXT CHECK (page_type IN ('landing', 'homepage', 'pricing', 'product', 'sales', 'other')),
  -- Optional user-provided context (improves diagnosis quality)
  desired_action   TEXT,
  target_audience  TEXT,
  business_type    TEXT,
  visitor_temp     TEXT CHECK (visitor_temp IN ('cold', 'warm', 'hot')),
  biggest_concern  TEXT,
  -- Timestamps
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ
);

-- Page Snapshots: stores extracted content from the submitted URL
CREATE TABLE page_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id         UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  title                 TEXT,
  meta_description      TEXT,
  h1_text               TEXT,
  h2_texts              TEXT[] DEFAULT '{}',
  h3_texts              TEXT[] DEFAULT '{}',
  cta_texts             TEXT[] DEFAULT '{}',
  nav_items             TEXT[] DEFAULT '{}',
  body_text             TEXT NOT NULL,   -- stripped readable text sent to AI
  word_count            INTEGER DEFAULT 0,
  testimonial_snippets  TEXT[] DEFAULT '{}',
  pricing_snippets      TEXT[] DEFAULT '{}',
  faq_snippets          TEXT[] DEFAULT '{}',
  form_fields           TEXT[] DEFAULT '{}',
  scraped_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reports: the final diagnosis output
CREATE TABLE reports (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id      UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE UNIQUE,
  overall_score      INTEGER NOT NULL CHECK (overall_score BETWEEN 0 AND 100),
  tier               TEXT NOT NULL CHECK (tier IN ('critical', 'needs-work', 'solid', 'optimized')),
  executive_summary  TEXT NOT NULL,
  core_problem       TEXT,                         -- upstream root problem (1 sentence)
  visitor_journey    JSONB NOT NULL DEFAULT '[]',  -- string[]: what a new visitor experiences
  primary_direction  TEXT,                         -- prescriptive message direction
  problem_type       TEXT NOT NULL DEFAULT 'mixed'
                       CHECK (problem_type IN ('messaging', 'trust', 'offer', 'flow', 'differentiation', 'friction', 'mixed')),
  whats_working      JSONB NOT NULL DEFAULT '[]',  -- string[]
  tier1_blockers     JSONB NOT NULL DEFAULT '[]',  -- DiagnosisIssue[]
  tier2_friction     JSONB NOT NULL DEFAULT '[]',  -- DiagnosisIssue[]
  tier3_polish       JSONB NOT NULL DEFAULT '[]',  -- DiagnosisIssue[]
  fix_first          TEXT NOT NULL,
  strategic_note     TEXT NOT NULL,
  sections           JSONB NOT NULL DEFAULT '[]',  -- DiagnosisSection[]
  pipeline_meta      JSONB,
  flagged            BOOLEAN DEFAULT false,        -- admin QA flag
  flag_note          TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_submissions_status     ON submissions(status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX idx_reports_submission_id  ON reports(submission_id);
CREATE INDEX idx_reports_flagged        ON reports(flagged) WHERE flagged = true;
CREATE INDEX idx_snapshots_submission   ON page_snapshots(submission_id);
