-- Enable Row Level Security on all tables.
-- The service role key (used server-side only) bypasses RLS automatically.
-- These policies block any anon/public access — all reads and writes go through
-- the server using the service role, so blocking anon is safe and correct.

ALTER TABLE submissions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_snapshots    ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports           ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewrite_requests  ENABLE ROW LEVEL SECURITY;

-- Drop any existing permissive policies before creating restrictive ones
DROP POLICY IF EXISTS "Allow all" ON submissions;
DROP POLICY IF EXISTS "Allow all" ON page_snapshots;
DROP POLICY IF EXISTS "Allow all" ON reports;
DROP POLICY IF EXISTS "Allow all" ON rewrite_requests;

-- Block all anon/authenticated role access
-- (service role bypasses RLS, so server-side operations are unaffected)
CREATE POLICY "deny_public_submissions"      ON submissions       AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "deny_public_page_snapshots"   ON page_snapshots    AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "deny_public_reports"          ON reports           AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "deny_public_rewrite_requests" ON rewrite_requests  AS RESTRICTIVE FOR ALL TO anon, authenticated USING (false);
