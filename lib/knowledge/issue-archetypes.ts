import type { IssueArchetypeId, RubricDimension, IssueSeverity } from "@/lib/types";

// ─── Archetype Catalog ────────────────────────────────────────────────────────
// These are the common conversion failure patterns the diagnosis engine
// is trained to recognize. Each archetype has a default severity,
// the dimension it maps to, a diagnostic question to guide detection,
// and the standard recommendation pattern.
//
// The AI uses these as a structured reference — not a script.
// New archetypes can be added here without touching the prompt directly.

export const ISSUE_ARCHETYPES: Record<
  IssueArchetypeId,
  {
    label: string;
    dimension: RubricDimension;
    default_severity: IssueSeverity;
    diagnostic_question: string;
    what_to_look_for: string[];
    standard_recommendation: string;
  }
> = {
  vague_headline: {
    label: "Vague Headline",
    dimension: "headline_clarity",
    default_severity: "critical",
    diagnostic_question: "Would a first-time visitor understand exactly what this page offers and who it is for after reading only the headline?",
    what_to_look_for: [
      "Headline uses generic words like 'powerful', 'easy', 'innovative', 'next-level'",
      "Headline names the company but not the offer",
      "Headline is a metaphor or tagline without literal meaning",
      "Headline requires reading the subheadline to make sense",
    ],
    standard_recommendation:
      "Rewrite to name a specific outcome or benefit the target visitor cares about. The headline should answer: what is this, who is it for, and why does it matter?",
  },

  generic_cta: {
    label: "Generic CTA Copy",
    dimension: "cta_strength",
    default_severity: "high",
    diagnostic_question: "Does the CTA copy describe what specifically happens next, or is it a generic instruction?",
    what_to_look_for: [
      "Button reads 'Submit', 'Click here', 'Get started', 'Learn more', 'Sign up'",
      "CTA gives no indication of what the visitor receives",
      "CTA language is the same as every competitor's CTA",
    ],
    standard_recommendation:
      "Replace with CTA copy that names the specific next step and value received. Example: 'Get my free diagnosis' or 'Start your 14-day trial' instead of 'Get started'.",
  },

  buried_cta: {
    label: "CTA Buried Too Low",
    dimension: "cta_strength",
    default_severity: "high",
    diagnostic_question: "Must a visitor scroll significantly before encountering any CTA?",
    what_to_look_for: [
      "No CTA visible above the fold",
      "Only one CTA on a long page, positioned at the end",
      "CTA appears after all feature/benefit content with no earlier prompt to act",
    ],
    standard_recommendation:
      "Add a primary CTA in the hero section (above the fold) and at natural decision points throughout the page. A visitor should never have to scroll back to find where to act.",
  },

  weak_value_prop: {
    label: "Weak Value Proposition",
    dimension: "value_proposition",
    default_severity: "critical",
    diagnostic_question: "Can a visitor clearly articulate what makes this offer uniquely valuable to them after reading the page?",
    what_to_look_for: [
      "Benefits listed as features without outcome framing",
      "No meaningful differentiation from the obvious alternatives",
      "Value claims are vague: 'industry-leading', 'best-in-class', 'proven'",
    ],
    standard_recommendation:
      "Identify the one outcome the ideal visitor wants most and lead with it. Be specific about what they get, how it works, and why it is better than the alternative they are already considering.",
  },

  no_proof: {
    label: "No Social Proof",
    dimension: "trust_signals",
    default_severity: "critical",
    diagnostic_question: "Is there any credible third-party validation that the offer delivers what it claims?",
    what_to_look_for: [
      "No testimonials, reviews, case studies, or customer logos",
      "Only internal claims without external validation",
    ],
    standard_recommendation:
      "Add specific, credible proof: named testimonials with outcomes, recognizable customer logos, or verifiable results. One specific proof point outperforms ten generic ones.",
  },

  proof_too_late: {
    label: "Proof Appears Too Late",
    dimension: "proof_placement",
    default_severity: "high",
    diagnostic_question: "Does social proof appear before or near the primary CTA, or only at the bottom of a long page?",
    what_to_look_for: [
      "All testimonials are in a dedicated section below the fold",
      "Visitor must scroll past the CTA to reach any proof",
      "Proof and CTA are separated by a long features section",
    ],
    standard_recommendation:
      "Move at least one strong testimonial or proof point to the hero section or immediately adjacent to the primary CTA. Proof should appear before or at the moment of decision, not after.",
  },

  weak_trust_signals: {
    label: "Insufficient Trust Signals",
    dimension: "trust_signals",
    default_severity: "high",
    diagnostic_question: "For a first-time visitor with no prior knowledge of this company, does the page earn enough trust to act?",
    what_to_look_for: [
      "No visible security indicators near forms",
      "No company legitimacy signals (address, legal links, recognizable associations)",
      "Testimonials are anonymous or suspiciously positive without specifics",
    ],
    standard_recommendation:
      "Add legitimacy signals near high-friction points: security badges near forms, a recognizable client or publication logo, or a money-back guarantee. These reduce perceived risk at the moment of decision.",
  },

  unclear_offer: {
    label: "Unclear Offer",
    dimension: "offer_clarity",
    default_severity: "critical",
    diagnostic_question: "After reading the page, can a visitor say exactly what they are getting, for what cost or commitment, and what happens next?",
    what_to_look_for: [
      "What the product/service actually includes is not stated",
      "No pricing, timeframe, or scope given",
      "The next step after clicking CTA is ambiguous",
    ],
    standard_recommendation:
      "State the offer in concrete terms: what you get, what it costs or what commitment is required, and exactly what happens after clicking. Ambiguity breeds inaction.",
  },

  price_vague: {
    label: "Vague Pricing",
    dimension: "offer_clarity",
    default_severity: "high",
    diagnostic_question: "Does the visitor know what this costs before they have to contact you?",
    what_to_look_for: [
      "'Contact us for pricing' without any indication of range",
      "No pricing tier shown even for lowest entry point",
      "'Custom pricing' without context of who it is for",
    ],
    standard_recommendation:
      "Show at minimum a starting price, price range, or 'starting from' figure. If pricing is truly custom, explain why and what the evaluation process involves.",
  },

  too_much_friction: {
    label: "High Friction to Act",
    dimension: "friction",
    default_severity: "high",
    diagnostic_question: "Is the commitment required to take the primary action proportionate to the value offered at this point in the journey?",
    what_to_look_for: [
      "Form asks for phone, address, or company details before delivering value",
      "Requires account creation before showing the core product",
      "Primary CTA requires a large time or money commitment",
    ],
    standard_recommendation:
      "Match friction to the stage of the relationship. Cold visitors need a low-friction entry point. Reduce form fields to the minimum needed, and defer high-commitment asks until after initial value is delivered.",
  },

  action_before_belief: {
    label: "Action Asked Before Belief Is Earned",
    dimension: "flow",
    default_severity: "high",
    diagnostic_question: "Does the page ask visitors to act before giving them sufficient reason to believe the offer is right for them?",
    what_to_look_for: [
      "CTA appears at the top of the page before any benefit or proof is given",
      "Page jumps to pricing before explaining what the product does",
      "Visitor is asked to commit before their primary objection is addressed",
    ],
    standard_recommendation:
      "Sequence the page so belief precedes ask. Present the problem, the solution, credible proof, then the call to action. The visitor's question at each stage should be answered before the next ask.",
  },

  weak_differentiation: {
    label: "Weak Differentiation",
    dimension: "differentiation",
    default_severity: "high",
    diagnostic_question: "Is there a clear, specific reason stated for why this is the right choice over alternatives?",
    what_to_look_for: [
      "Page does not acknowledge that alternatives exist",
      "Differentiation is only in assertions ('we're the best') not in evidence",
      "The specific mechanism or approach that makes this different is not explained",
    ],
    standard_recommendation:
      "Name the specific thing that makes this offer different and better in a way that matters to the target visitor. Ground it in mechanism, outcome, or evidence — not assertion.",
  },

  poor_hierarchy: {
    label: "Poor Information Hierarchy",
    dimension: "message_hierarchy",
    default_severity: "medium",
    diagnostic_question: "Does the most important information appear first, and does each section follow logically from the last?",
    what_to_look_for: [
      "Page leads with company history or background, not visitor benefit",
      "Most compelling proof or differentiator is buried mid-page",
      "Headings are not scannable — visitor cannot grasp the page's argument without reading",
    ],
    standard_recommendation:
      "Lead with the highest-value proposition. Structure section headings so that scanning them alone tells the core story. The most important claim should be the first thing the visitor reads.",
  },

  scattered_flow: {
    label: "Scattered Page Flow",
    dimension: "flow",
    default_severity: "medium",
    diagnostic_question: "Does the page tell a coherent story that moves from problem to solution to proof to action?",
    what_to_look_for: [
      "Sections feel disconnected or randomly ordered",
      "Page ends without a clear next step",
      "Features and social proof are interleaved without a clear narrative",
    ],
    standard_recommendation:
      "Restructure around a clear narrative arc: establish the problem → present the solution → prove it works → remove objections → invite action. Each section should answer the next question a skeptical visitor would ask.",
  },

  weak_meta_description: {
    label: "Weak Meta Description",
    dimension: "message_hierarchy",
    default_severity: "low",
    diagnostic_question: "Does the meta description clearly communicate the page's value to someone who found it via search?",
    what_to_look_for: [
      "Meta description is auto-generated or missing",
      "Meta description describes the company generically",
      "Meta description does not include any reason to click",
    ],
    standard_recommendation:
      "Write a meta description that names the specific value the visitor gets and includes a reason to click. This impacts both SEO click-through and first impression before the page loads.",
  },

  feature_over_benefit: {
    label: "Features Prioritized Over Benefits",
    dimension: "value_proposition",
    default_severity: "medium",
    diagnostic_question: "Is copy primarily explaining how the product works, or what the visitor will experience or achieve?",
    what_to_look_for: [
      "Bullet points describe product features, not visitor outcomes",
      "Copy answers 'what does it do' instead of 'what does the visitor get'",
      "Technical specifications dominate over end-state descriptions",
    ],
    standard_recommendation:
      "Reframe features as outcomes. For each feature, ask 'so what does that mean for the visitor?' and lead with that answer. The product's capabilities are credibility detail, not the lead.",
  },
};
