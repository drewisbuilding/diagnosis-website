import { z } from "zod";

// ─── Stage 0: Visible Element Extraction ─────────────────────────────────────

export const VisibleElementsOutputSchema = z.object({
  app_store_badge: z.boolean(),
  google_play_badge: z.boolean(),
  primary_cta: z.boolean(),
  signup_link: z.boolean(),
  pricing_link: z.boolean(),
  navigation_cta: z.boolean(),
  product_ui_visible: z.boolean(),
  product_action_clear: z.boolean(),
  product_outcome_clear: z.boolean(),
});

export type VisibleElementsOutput = z.infer<typeof VisibleElementsOutputSchema>;

// ─── Stage 1: Classification ──────────────────────────────────────────────────

// Fixed dominant category list — the anchor for the entire diagnosis
export const DOMINANT_CATEGORIES = [
  "messaging_clarity",
  "audience_confusion",
  "offer_value_proposition",
  "cta_friction",
  "information_hierarchy",
  "trust_proof_gap",
] as const;

export type DominantCategory = typeof DOMINANT_CATEGORIES[number];

const InternalDimensionScoreSchema = z.object({
  dimension: z.enum([
    "audience_clarity",
    "value_proposition_clarity",
    "cta_friction",
    "information_hierarchy",
    "trust_proof",
  ]),
  // 1 = not problematic, 5 = critically problematic
  score: z.number().int().min(1).max(5),
});

export const ClassificationOutputSchema = z.object({
  page_type: z.enum(["landing", "homepage", "pricing", "product", "sales", "other"]),
  confidence: z.enum(["high", "medium", "low"]),
  reasoning: z.string(),
  primary_audience: z.string(),
  inferred_goal: z.string(),
  strongest_strategic_angle: z.string(),
  dominant_category: z.enum(DOMINANT_CATEGORIES),
  internal_dimension_scores: z.array(InternalDimensionScoreSchema).length(5),
});

export type ClassificationOutput = z.infer<typeof ClassificationOutputSchema>;

// ─── Stage 2: Issue Identification ───────────────────────────────────────────

export const RawIssueSchema = z.object({
  archetype_id: z.string(),
  dimension: z.enum([
    "headline_clarity",
    "value_proposition",
    "cta_strength",
    "trust_signals",
    "offer_clarity",
    "message_hierarchy",
    "friction",
    "proof_placement",
    "differentiation",
    "flow",
  ]),
  severity: z.enum(["critical", "high", "medium", "low"]),
  title: z.string(),
  prose: z.string(),
  observation: z.string(),
  root_cause: z.string().nullable(),
  why_it_matters: z.string(),
  recommended_change: z.string(),
  evidence: z.string().nullable().optional()
});

export const IssueIdentificationOutputSchema = z.object({
  // V1 limits: 1 critical (Primary Blocker) + max 2 high (Supporting Blockers)
  issues: z.array(RawIssueSchema).max(5),
  whats_working: z.array(z.string()).max(3),
});

export type IssueIdentificationOutput = z.infer<typeof IssueIdentificationOutputSchema>;

// ─── Stage 3: Dimension Scoring ───────────────────────────────────────────────

export const DimensionScoreSchema = z.object({
  dimension: z.enum([
    "headline_clarity",
    "value_proposition",
    "cta_strength",
    "trust_signals",
    "offer_clarity",
    "message_hierarchy",
    "friction",
    "proof_placement",
    "differentiation",
    "flow",
  ]),
  score: z.number().int().min(0).max(100),
  summary: z.string(),
});

export const ScoringOutputSchema = z.object({
  dimension_scores: z.array(DimensionScoreSchema),
});

export type ScoringOutput = z.infer<typeof ScoringOutputSchema>;

// ─── Stage 4: Rewrite Generation ─────────────────────────────────────────────

export const RewriteSchema = z.object({
  archetype_id: z.string(),
  rewrite: z.string(),
});

export const RewriteOutputSchema = z.object({
  // The single strongest recommended direction — prescriptive, not a list item.
  // Describes the overarching message/positioning change the page needs.
  primary_direction: z.string(),
  rewrites: z.array(RewriteSchema),
});

export type RewriteOutput = z.infer<typeof RewriteOutputSchema>;

// ─── Stage 5: Final Synthesis ─────────────────────────────────────────────────

export const SynthesisOutputSchema = z.object({
  title: z.string(),
  executive_summary: z.string(),
  core_problem: z.string(),
  intent_vs_reality: z.object({
    intent: z.string(),
    reality: z.string(),
  }).optional(),
  visitor_journey: z.array(z.string()).min(3).max(5),
  fix_first: z.string(),
  cta_transition: z.string(),
  strategic_note: z.string(),
  problem_type: z.enum(["messaging", "trust", "offer", "flow", "differentiation", "friction", "mixed"]),
});
export type SynthesisOutput = z.infer<typeof SynthesisOutputSchema>;
