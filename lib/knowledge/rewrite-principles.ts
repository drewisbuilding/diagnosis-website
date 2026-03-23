// ─── Rewrite Principles ───────────────────────────────────────────────────────
// These are injected into the rewrite generation stage to guide
// how the AI produces copy suggestions. They are operational rules,
// not stylistic preferences.

export const REWRITE_PRINCIPLES = {
  // ── Headline rewrites ──
  headline: [
    "Lead with the outcome the reader gets, not what the company does",
    "Use specific language: name a result, timeframe, or audience where possible",
    "Avoid superlatives (best, fastest, most powerful) unless immediately proven",
    "The rewrite should be understandable without reading anything else on the page",
    "Do not use questions unless the question immediately creates relevant tension",
    "Length: aim for 6–12 words, maximum 15",
  ],

  // ── CTA rewrites ──
  cta: [
    "Name what the visitor gets or does, not what the company wants ('Get my report' not 'Submit')",
    "Use first-person framing where natural ('Start my free trial' not 'Start your free trial')",
    "Reduce perceived risk with a micro-copy line below the button when commitment is significant",
    "Avoid starting with a verb that implies work: 'Fill out', 'Complete', 'Register'",
    "Preferred action verbs: Get, Start, See, Try, Claim, Access, Unlock",
  ],

  // ── Value proposition rewrites ──
  value_proposition: [
    "State the single most important outcome the visitor cares about",
    "Name the mechanism, approach, or differentiator that makes this possible",
    "Avoid hedging language: 'can help', 'may', 'designed to' weakens commitment",
    "Compare to the status quo or the alternative, explicitly or implicitly",
    "One specific claim beats three vague ones",
  ],

  // ── Trust copy rewrites ──
  trust: [
    "Specificity is credibility: name companies, cite numbers, quote real people",
    "Testimonials should name the result, not just express satisfaction",
    "Guarantees should state exactly what is guaranteed and for how long",
    "Proof near the CTA should address the most likely reason not to act",
  ],

  // ── General principles (applied to all rewrites) ──
  general: [
    "Match the vocabulary of the target audience, not the company's internal language",
    "Use plain, direct language. If a simpler word exists, use it.",
    "Every sentence should earn its place — if it does not add value, remove it",
    "The rewrite should be implementable immediately by a developer or designer",
    "Do not write rewrites that require a photoshoot, new data, or engineering work to implement — unless flagged as such",
  ],
} as const;

// ─── Forbidden Phrases ────────────────────────────────────────────────────────
// The engine should flag or avoid these in rewrites and in its observations.
// They signal vagueness without substance.

export const FORBIDDEN_PHRASES = [
  "world-class",
  "industry-leading",
  "best-in-class",
  "cutting-edge",
  "innovative",
  "revolutionary",
  "next-level",
  "synergy",
  "holistic",
  "seamless",
  "robust solution",
  "empower your business",
  "transform your",
  "unlock your potential",
  "take it to the next level",
  "game-changer",
  "we're passionate about",
  "we care deeply about",
  "trusted by thousands",
  "proven results",
] as const;
