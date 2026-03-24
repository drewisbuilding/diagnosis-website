// ─── Submission ───────────────────────────────────────────────────────────────

export type SubmissionStatus =
  | "pending"
  | "scraping"
  | "diagnosing"
  | "complete"
  | "failed";

export interface Submission {
  id: string;
  url: string;
  status: SubmissionStatus;
  error: string | null;
  page_type: PageType | null;
  // Optional user-provided context
  desired_action: string | null;
  target_audience: string | null;
  business_type: string | null;
  visitor_temp: VisitorTemperature | null;
  biggest_concern: string | null;
  created_at: string;
  completed_at: string | null;
  analysis_id: string | null;
}

export type VisitorTemperature = "cold" | "warm" | "hot";

// ─── Page Snapshot ────────────────────────────────────────────────────────────

export interface PageSnapshot {
  id: string;
  submission_id: string;
  // Extracted content
  title: string | null;
  meta_description: string | null;
  h1_text: string | null;
  h2_texts: string[];
  h3_texts: string[];
  cta_texts: string[];
  nav_items: string[];
  body_text: string; // Clean readable text (stripped HTML)
  word_count: number;
  // Optional detected elements
  testimonial_snippets: string[];
  pricing_snippets: string[];
  faq_snippets: string[];
  form_fields: string[];
  scraped_at: string;
}

// ─── Page Classification ──────────────────────────────────────────────────────

export type PageType =
  | "landing"
  | "homepage"
  | "pricing"
  | "product"
  | "sales"
  | "other";

// ─── Rubric Dimensions ────────────────────────────────────────────────────────

export type RubricDimension =
  | "headline_clarity"
  | "value_proposition"
  | "cta_strength"
  | "trust_signals"
  | "offer_clarity"
  | "message_hierarchy"
  | "friction"
  | "proof_placement"
  | "differentiation"
  | "flow";

// ─── Issue Severity ───────────────────────────────────────────────────────────

export type IssueSeverity = "critical" | "high" | "medium" | "low";

// ─── Issue Archetypes ─────────────────────────────────────────────────────────

export type IssueArchetypeId =
  | "vague_headline"
  | "generic_cta"
  | "buried_cta"
  | "weak_value_prop"
  | "no_proof"
  | "proof_too_late"
  | "weak_trust_signals"
  | "unclear_offer"
  | "price_vague"
  | "too_much_friction"
  | "action_before_belief"
  | "weak_differentiation"
  | "poor_hierarchy"
  | "scattered_flow"
  | "weak_meta_description"
  | "feature_over_benefit";

// ─── Diagnosis Issues ─────────────────────────────────────────────────────────

export interface DiagnosisIssue {
  archetype_id: IssueArchetypeId;
  severity: IssueSeverity;
  dimension: RubricDimension;
  title: string; // Interpretive diagnosis in plain language
  prose: string; // Integrated narrative: what's happening, why, and what it costs — no labeled fields
  observation: string; // Raw observation (used by pipeline stages; not displayed directly)
  root_cause: string | null;
  why_it_matters: string;
  recommended_change: string;
  rewrite: string | null;
  evidence: string | null;
}

// ─── Report Sections ──────────────────────────────────────────────────────────

export interface DiagnosisSection {
  dimension: RubricDimension;
  label: string; // Human-readable: "Headline Clarity"
  score: number; // 0–100 for this dimension
  issues: DiagnosisIssue[];
  summary: string; // 1-sentence verdict for this dimension
}

// ─── Overall Score Tier ───────────────────────────────────────────────────────

export type DiagnosisTier =
  | "critical" // 0–39: Page has severe conversion blockers
  | "needs-work" // 40–64: Meaningful issues reducing performance
  | "solid" // 65–79: Performing reasonably, room to improve
  | "optimized"; // 80–100: Well-structured, minor refinements only

// ─── Full Report ──────────────────────────────────────────────────────────────

export type ProblemType =
  | "messaging" // The page doesn't clearly communicate what's on offer
  | "trust" // The page fails to establish credibility with a cold visitor
  | "offer" // The offer itself is unclear, vague, or uncompelling
  | "flow" // The page's structure works against the visitor's decision process
  | "differentiation" // The page doesn't explain why this over alternatives
  | "friction" // The page creates unnecessary barriers to action
  | "mixed"; // Multiple equally-weighted problem types

export interface Report {
  id: string;
  submission_id: string;
  overall_score: number; // 0–100 weighted aggregate
  tier: DiagnosisTier;
  title: string; // One-line diagnosis header: "Your page isn't X — it just Y"
  executive_summary: string; // 2-3 sentence strategic verdict
  core_problem: string; // One sharp sentence: the upstream root problem driving all issues
  visitor_journey: string[]; // 3-5 bullets: what a new visitor actually experiences on this page
  problem_type: ProblemType; // Core category of the page's main problem
  whats_working: string[]; // Up to 3 genuine strengths observed
  tier1_blockers: DiagnosisIssue[]; // Critical severity — [0] is primary blocker, rest are supporting
  tier2_friction: DiagnosisIssue[]; // High severity — meaningful friction
  tier3_polish: DiagnosisIssue[]; // Medium/low — refinements
  intent_vs_reality: { intent: string; reality: string } | null; // What the page tries to say vs. what a visitor actually gets
  fix_first: string; // Single clearest priority recommendation
  cta_transition: string; // 1-2 sentence bridge from diagnosis to next step — created for the free diagnosis only
  primary_direction: string; // The recommended headline/message direction (prescriptive)
  strategic_note: string; // Broader strategic observation (1-2 sentences)
  sections: DiagnosisSection[]; // Full scored breakdown by dimension
  pipeline_meta: PipelineMeta | null;
  flagged: boolean; // Admin QA flag
  flag_note: string | null;
  created_at: string;
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

export type PipelineStage =
  | "scrape"
  | "classify"
  | "extract_visible_elements"
  | "score"
  | "identify_issues"
  | "generate_rewrites"
  | "synthesize";

export interface PipelineMeta {
  stages: Array<{
    stage: PipelineStage;
    duration_ms: number;
    tokens_used?: number;
  }>;
  total_duration_ms: number;
  model: string;
}

// ─── API I/O ──────────────────────────────────────────────────────────────────

export interface DiagnoseRequest {
  url: string;
  desired_action?: string;
  target_audience?: string;
  business_type?: string;
  visitor_temp?: VisitorTemperature;
  biggest_concern?: string;
}

export interface DiagnoseResponse {
  submission_id: string;
}

export interface SubmissionContext {
  url: string;
  desired_action: string | null;
  page_type: string | null;
  created_at: string;
}

export interface ReportStatusResponse {
  status: SubmissionStatus;
  report: Report | null;
  submission: SubmissionContext | null;
  error: string | null;
}
