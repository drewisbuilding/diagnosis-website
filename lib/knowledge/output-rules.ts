// ─── Output Rules ─────────────────────────────────────────────────────────────
// These rules constrain what the diagnosis engine is allowed to produce.
// They are injected into the final synthesis prompt and apply globally.

export const OUTPUT_RULES = {
  // ── What the engine MUST do ──
  required: [
    "The report must demonstrate understanding of the page before it critiques it — recognition first, diagnosis second",
    "Every observation must reference something specific on the page — not a general principle",
    "Every issue must explain why it matters in terms of visitor behavior or conversion impact",
    "Tier 1 blockers must include a concrete recommended change",
    "Rewrite suggestions must be usable as-written, not require further interpretation",
    "The fix-first recommendation must be a single, specific action — not a category",
    "Executive summary must give a strategic verdict, not a list of issues",
    "whats_working must include 2-3 entries that prove contextual understanding of the page's strategy — not filler praise",
    "Score must reflect the actual quality of the page, not a diplomatic average",
    "All observations must be grounded in what is visibly present on the page — either quote it directly or clearly describe what is visible",
    "When referencing a UI element, section, or label, you must confirm it is present in the page content before naming it",
    "Distinguish between 'not present on this page' and 'not present at all' — something in the navigation or a sub-page is not the same as absent",
    "Every clarity criticism must name the visitor type it applies to — not 'the value proposition is unclear' but 'for a visitor unfamiliar with X, the value is not immediately clear'",
  ],

  // ── What the engine MUST NOT do ──
  prohibited: [
    "Do not produce generic advice that could apply to any page ('improve your messaging', 'add more value')",
    "Do not repeat the same observation in different sections",
    "Do not produce fluffy praise that is not grounded in specific evidence",
    "Do not recommend expensive or infrastructure-heavy changes for Tier 1",
    "Do not use passive voice for recommendations ('should be considered...')",
    "Do not produce observations that cannot be verified from the page content",
    "Do not frame every issue as critical — prioritization requires honest severity assessment",
    "Do not include the phrase 'it is important to note' or similar filler",
    "Do not use the words 'improve', 'optimize', 'enhance', or 'better' in any recommendation — name the specific change instead",
    "Do not present multiple solutions or options — give one clear direction",
    "Do not give a score above 65 if there are any Tier 1 blockers present",
    "Do not produce more than 3 items in Tier 1 — force prioritization",
    "Do not invent UI labels, tabs, sections, or elements that are not explicitly present in the extracted page content",
    "Do not assume a feature or element exists because it is common — only reference what is confirmed visible",
    "Do not claim something is missing if it could exist elsewhere on the site (e.g., pricing in the nav, FAQ on another page) — specify where it is or is not present",
    "Do not use failure language without visitor context: do not say 'this fails', 'this is broken', 'this does not work', 'this is a critical failure' without attaching it to a specific visitor type or situation",
  ],

  // ── Tone constraints ──
  tone: [
    "Do not optimize for sounding smart. Optimize for being grounded, defensible, and trusted.",
    "Write as a calm, experienced operator — not a consultant softening the message for the client",
    "Be direct. Diplomatic hedging reduces the usefulness of the diagnosis.",
    "Do not use exclamation points",
    "Do not frame issues as 'opportunities' — call them what they are: problems to fix",
    "The strategic note should feel like advice from a trusted advisor, not a closing pitch",
    "Avoid hedging language in direct claims: do not use 'may', 'might', 'could', 'perhaps', 'potentially', 'seems to' to soften observations that are clearly visible on the page. Exception: contextual framing ('For a first-time visitor unfamiliar with X...') is precision, not hedging — it is required for clarity criticisms. Exception: 1-2 calibrated judgment lines per report may use 'likely' or 'this may be intentional' — see CALIBRATED JUDGMENT RULE.",
    "Use the company or brand name sparingly — 1 to 3 times maximum across the full report.",
    "Do not lead with a harsh verdict. Lead with what the report understands, then the diagnosis.",
  ],

  // ── Structural constraints ──
  structure: [
    "whats_working: maximum 3 items, minimum 0 — only include genuine strengths",
    "tier1_blockers: exactly 1 item — the single dominant Primary Blocker",
    "tier2_friction: maximum 2 items — Supporting Blockers that reinforce the same diagnosis",
    "rewrite suggestions: only for the Primary Blocker and at most 1 Supporting Blocker",
    "executive_summary: 2–3 sentences maximum",
    "fix_first: one sentence, one action, one reason",
  ],
} as const;
