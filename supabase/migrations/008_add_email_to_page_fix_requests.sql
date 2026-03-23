-- ─── Add email to page_fix_requests ─────────────────────────────────────────
-- email is required on the direct rewrite request path.
-- Uses a temporary DEFAULT to safely handle any existing rows (table likely empty).
-- Safe to run even if migration 007 was never run (table created there first).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'page_fix_requests' AND column_name = 'email'
  ) THEN
    -- Add column with a temporary default so existing rows (if any) get a value
    ALTER TABLE page_fix_requests ADD COLUMN email text NOT NULL DEFAULT '';
    -- Remove the default — application must always provide email going forward
    ALTER TABLE page_fix_requests ALTER COLUMN email DROP DEFAULT;
  END IF;
END $$;
