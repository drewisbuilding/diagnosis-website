-- ─── Report Enhancements — Migration 002 ─────────────────────────────────────
-- Run this if you already applied migration 001.
-- Adds core_problem, visitor_journey, and primary_direction to reports.

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS core_problem      TEXT,
  ADD COLUMN IF NOT EXISTS visitor_journey   JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS primary_direction TEXT;
