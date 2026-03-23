import type { RubricDimension, DiagnosisTier } from "@/lib/types";

// ─── Dimension Definitions ────────────────────────────────────────────────────
// Each dimension has a weight (must sum to 1.0), a label, and a description
// used to guide AI scoring. Adjust weights to shift what the final score
// emphasizes most.

export const RUBRIC_DIMENSIONS: Record<
  RubricDimension,
  {
    label: string;
    weight: number;
    description: string;
    good_signals: string[];
    bad_signals: string[];
  }
> = {
  headline_clarity: {
    label: "Headline Clarity",
    weight: 0.18,
    description:
      "Does the primary headline clearly communicate what the page offers, to whom, and why it matters — within the first 3 seconds?",
    good_signals: [
      "Headline names a specific outcome or benefit",
      "Headline directly addresses the reader's situation",
      "Headline creates immediate clarity about what is being offered",
    ],
    bad_signals: [
      "Headline is generic ('Welcome to...', 'The best solution for...')",
      "Headline is brand name without benefit context",
      "Headline is too abstract or metaphorical",
      "Headline requires reading further to understand the offer",
    ],
  },

  value_proposition: {
    label: "Value Proposition",
    weight: 0.16,
    description:
      "Is it clear what specific value the visitor gets, how it is delivered, and why this is meaningfully better or different from alternatives?",
    good_signals: [
      "Unique outcome or mechanism is clearly stated",
      "Comparison to alternatives is implicit or explicit",
      "Value is expressed in terms of the visitor's goal, not the company's feature list",
    ],
    bad_signals: [
      "Copy focuses on features rather than outcomes",
      "No differentiation from competitors is apparent",
      "Value is vague ('powerful', 'easy', 'better')",
    ],
  },

  cta_strength: {
    label: "CTA Strength",
    weight: 0.14,
    description:
      "Are the calls to action specific, motivating, and positioned at the right moments relative to the user's readiness to act?",
    good_signals: [
      "CTA copy specifies what happens next ('Start your free analysis')",
      "CTA is visible above the fold and at key decision points",
      "CTA reduces risk ('No credit card required', 'Cancel anytime')",
    ],
    bad_signals: [
      "CTA is generic ('Submit', 'Click here', 'Learn more', 'Get started')",
      "CTA appears before the visitor has enough context to act",
      "CTA asks for a large commitment before earning trust",
      "Only one CTA on a long page",
    ],
  },

  trust_signals: {
    label: "Trust Signals",
    weight: 0.12,
    description:
      "Does the page provide credibility cues that reduce perceived risk and establish legitimacy for a first-time visitor?",
    good_signals: [
      "Named customers, recognizable logos, or credible associations visible",
      "Specific numbers or results cited (not vague percentages)",
      "Security badges or guarantees near high-friction moments",
    ],
    bad_signals: [
      "No recognizable social proof visible",
      "Testimonials are generic ('Great product!')",
      "No contact information, legal links, or company context",
    ],
  },

  offer_clarity: {
    label: "Offer Clarity",
    weight: 0.12,
    description:
      "Is it immediately clear what the visitor is being asked to do and what they will receive in return?",
    good_signals: [
      "Offer is specific (price, deliverable, timeline, scope)",
      "What happens after clicking CTA is explained",
      "Trial, demo, or free tier is clearly described",
    ],
    bad_signals: [
      "Pricing is hidden or vague",
      "It is unclear what the product or service actually includes",
      "The next step is ambiguous",
    ],
  },

  message_hierarchy: {
    label: "Message Hierarchy",
    weight: 0.1,
    description:
      "Is content organized so the most important information appears first, with supporting detail layered appropriately?",
    good_signals: [
      "Biggest benefit or proof point appears above the fold",
      "Page structure mirrors a logical decision journey",
      "Section headings guide scanners effectively",
    ],
    bad_signals: [
      "Key selling point is buried below the fold",
      "Page leads with company history instead of visitor benefit",
      "Information is presented in reverse order of importance",
    ],
  },

  friction: {
    label: "Friction",
    weight: 0.08,
    description:
      "Does the page minimize unnecessary barriers between the visitor and the desired action?",
    good_signals: [
      "Forms ask for minimal information relative to the offer",
      "Page load and layout feel fast and uncluttered",
      "Objections are addressed near the CTA",
    ],
    bad_signals: [
      "Form asks for too much information too early",
      "Navigation or exit links distract from the primary action",
      "Page is visually overwhelming or hard to scan",
    ],
  },

  proof_placement: {
    label: "Proof Placement",
    weight: 0.06,
    description:
      "Does social proof appear at the moments when visitor doubt is highest — before key decision points?",
    good_signals: [
      "Testimonials or case results appear near the CTA",
      "Proof addresses the most common objections",
      "Results are specific and credible (named, numbered)",
    ],
    bad_signals: [
      "All testimonials are at the bottom of a long page",
      "Proof section exists but is disconnected from the offer",
      "Testimonials are vague or anonymous",
    ],
  },

  differentiation: {
    label: "Differentiation",
    weight: 0.06,
    description:
      "Does the page clearly communicate why this offer is the right choice over alternatives — including doing nothing?",
    good_signals: [
      "Specific mechanism, approach, or result distinguishes the offer",
      "Comparison (implicit or explicit) to alternatives is present",
      "The 'why us' is rooted in evidence, not assertion",
    ],
    bad_signals: [
      "Page sounds like every competitor in the space",
      "Differentiation claims are vague ('best in class', 'proven')",
      "No stated reason why this is the right choice now",
    ],
  },

  flow: {
    label: "Page Flow",
    weight: 0.04,
    description:
      "Does the narrative arc of the page move a visitor from awareness to readiness to act in a logical sequence?",
    good_signals: [
      "Page moves: Problem → Solution → Proof → Offer → Action",
      "Each section answers the next natural question a visitor would have",
    ],
    bad_signals: [
      "Page jumps to features before establishing problem context",
      "Page ends without a clear next step",
      "Sections feel disconnected or randomly ordered",
    ],
  },
};

// ─── Tier Thresholds ──────────────────────────────────────────────────────────

export const TIER_THRESHOLDS: Record<DiagnosisTier, { min: number; max: number; label: string; description: string }> = {
  critical: {
    min: 0,
    max: 39,
    label: "Critical",
    description: "Significant structural issues likely suppressing conversions. Prioritize fundamental fixes before any optimization.",
  },
  "needs-work": {
    min: 40,
    max: 64,
    label: "Needs Work",
    description: "Meaningful gaps reducing performance. Address blockers in order and expect noticeable improvement.",
  },
  solid: {
    min: 65,
    max: 79,
    label: "Solid",
    description: "Page is functioning reasonably. Focus on highest-leverage refinements.",
  },
  optimized: {
    min: 80,
    max: 100,
    label: "Optimized",
    description: "Well-structured page with minor improvements available.",
  },
};

export function scoreToTier(score: number): DiagnosisTier {
  if (score <= 39) return "critical";
  if (score <= 64) return "needs-work";
  if (score <= 79) return "solid";
  return "optimized";
}

export function computeOverallScore(
  dimensionScores: Partial<Record<RubricDimension, number>>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [dim, score] of Object.entries(dimensionScores)) {
    const def = RUBRIC_DIMENSIONS[dim as RubricDimension];
    if (!def) continue;
    weightedSum += score * def.weight;
    totalWeight += def.weight;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
}
