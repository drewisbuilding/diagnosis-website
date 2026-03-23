/**
 * One-shot pipeline runner for manual verification.
 * Usage: npx tsx scripts/run-sample.ts <url>
 *
 * Runs the full diagnosis pipeline and prints the report to stdout.
 * Does NOT write to the database.
 */

import { fetchPage } from "../lib/parsing/fetcher";
import { extractPageData } from "../lib/parsing/extractor";
import { normalizePageData } from "../lib/parsing/normalizer";
import { runDiagnosisPipeline } from "../lib/ai/pipeline";
import type { Submission } from "../lib/types";

const url = process.argv[2];
if (!url) {
  console.error("Usage: npx tsx scripts/run-sample.ts <url>");
  process.exit(1);
}

const FAKE_ID = "00000000-0000-0000-0000-000000000000";

const fakeSubmission: Submission = {
  id: FAKE_ID,
  url,
  status: "diagnosing",
  error: null,
  page_type: null,
  analysis_id: null,
  desired_action: null,
  target_audience: null,
  business_type: null,
  visitor_temp: null,
  biggest_concern: null,
  created_at: new Date().toISOString(),
  completed_at: null,
};

async function main() {
  console.log(`\n${"─".repeat(60)}`);
  console.log(`FETCHING: ${url}`);
  console.log(`${"─".repeat(60)}\n`);

  const fetched = await fetchPage(url);
  const rawData = extractPageData(fetched.html);
  const snapshot = {
    ...normalizePageData(FAKE_ID, rawData),
    id: FAKE_ID,
    scraped_at: new Date().toISOString(),
  };

  console.log(`Page snapshot:`);
  console.log(`  Title:      ${snapshot.title ?? "(none)"}`);
  console.log(`  H1:         ${snapshot.h1_text ?? "(none)"}`);
  console.log(`  H2s:        ${snapshot.h2_texts.slice(0, 3).join(" / ") || "(none)"}`);
  console.log(`  CTAs:       ${snapshot.cta_texts.join(", ") || "(none)"}`);
  console.log(`  Word count: ${snapshot.word_count}`);
  console.log(`  Has proof:  ${snapshot.testimonial_snippets.length > 0}`);
  console.log(`  Has pricing:${snapshot.pricing_snippets.length > 0}`);
  console.log();

  console.log(`Running pipeline...\n`);

  const { report, analysisJson } = await runDiagnosisPipeline(snapshot, fakeSubmission);

  // ── FULL REPORT OUTPUT ──────────────────────────────────────────────────────

  const hr = () => console.log("─".repeat(60));

  hr();
  console.log("CLASSIFICATION");
  hr();
  console.log(`Page type:               ${analysisJson.page_type}`);
  console.log(`Dominant issue category: ${analysisJson.dominant_issue}`);
  console.log();

  hr();
  console.log("CONTEXT RECOGNITION (what the engine understood first)");
  hr();
  // These come from classification and are passed through — print from analysisJson
  // We need to print what was inferred. Let's look at primary_audience etc. from
  // the executive_summary / intent as proxy since analysisJson doesn't directly store them.
  console.log(`Intent:    ${analysisJson.intent ?? "(not captured)"}`);
  console.log(`Reality:   ${analysisJson.reality ?? "(not captured)"}`);
  console.log();

  hr();
  console.log("EXECUTIVE SUMMARY");
  hr();
  console.log(report.executive_summary);
  console.log();

  hr();
  console.log("CORE PROBLEM");
  hr();
  console.log(report.core_problem);
  console.log();

  hr();
  console.log("WHAT'S WORKING (strengths)");
  hr();
  if (report.whats_working.length === 0) {
    console.log("(none identified)");
  } else {
    report.whats_working.forEach((s, i) => console.log(`${i + 1}. ${s}`));
  }
  console.log();

  hr();
  console.log("VISITOR JOURNEY");
  hr();
  report.visitor_journey.forEach((step, i) => console.log(`${i + 1}. ${step}`));
  console.log();

  hr();
  console.log("PRIMARY BLOCKER");
  hr();
  const pb = report.tier1_blockers[0];
  if (pb) {
    console.log(`Title:     ${pb.title}`);
    console.log(`Severity:  ${pb.severity}`);
    console.log(`\nProse:\n${pb.prose}`);
    console.log(`\nEvidence: ${pb.evidence ?? "(none)"}`);
    console.log(`\nWhat to change:\n${pb.recommended_change}`);
  } else {
    console.log("(none)");
  }
  console.log();

  hr();
  console.log("SUPPORTING BLOCKERS");
  hr();
  if (report.tier2_friction.length === 0) {
    console.log("(none)");
  } else {
    report.tier2_friction.forEach((b, i) => {
      console.log(`\n[${i + 1}] ${b.title}`);
      console.log(`Prose: ${b.prose}`);
      console.log(`What to change: ${b.recommended_change}`);
    });
  }
  console.log();

  hr();
  console.log("IMMEDIATE FIX");
  hr();
  console.log(report.fix_first);
  console.log();

  hr();
  console.log("STRATEGIC NOTE");
  hr();
  console.log(report.strategic_note);
  console.log();

  hr();
  console.log("SCORES");
  hr();
  console.log(`Overall: ${report.overall_score}/100 (${report.tier})`);
  console.log(`Problem type: ${report.problem_type}`);
  report.sections.forEach((s) => {
    console.log(`  ${s.label.padEnd(22)} ${String(s.score).padStart(3)}/100  ${s.summary}`);
  });
  console.log();

  hr();
  console.log("PIPELINE STATS");
  hr();
  report.pipeline_meta?.stages.forEach((s) => {
    console.log(`  ${s.stage.padEnd(20)} ${s.duration_ms}ms  ${s.tokens_used ?? "?"} tokens`);
  });
  console.log(`  ${"TOTAL".padEnd(20)} ${report.pipeline_meta?.total_duration_ms}ms`);
  console.log();
}

main().catch((err) => {
  console.error("\nPipeline failed:", err.message ?? err);
  process.exit(1);
});
