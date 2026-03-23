// ─── Email Templates ──────────────────────────────────────────────────────────
// Fix Plan delivery email and follow-up sequence.
//
// TODO: Wire these to an email provider (Resend, Postmark, Loops, etc.)
// Template variables are passed as function arguments.
// Each template returns { subject, body } — both plain-text friendly.
//
// Sequence:
//   FIX_PLAN_EMAIL  — sent when the user requests their Fix Plan (immediate)
//   FOLLOWUP_1      — ~24 hours after delivery
//   FOLLOWUP_2      — ~72 hours after delivery
//   FOLLOWUP_3      — ~7 days after delivery

// ─── Fix Plan delivery ────────────────────────────────────────────────────────

export const FIX_PLAN_EMAIL = {
  subject: "Your homepage is losing people here",

  body: (params: {
    pageUrl: string;
    issues: string[];
    rewrittenHeadline: string;
    rewrittenSubheadline: string;
    rewrittenCta: string;
    paymentLink: string;
  }): string => `
Hey — I ran your page through the analysis.

Here's what I found on ${params.pageUrl}.

---

WHAT'S GOING WRONG

${params.issues.map((i) => `• ${i}`).join("\n")}

---

WHAT I WOULD CHANGE

Headline:
${params.rewrittenHeadline}

Subheadline:
${params.rewrittenSubheadline}

CTA:
${params.rewrittenCta}

---

WHY THIS MATTERS

Visitors shouldn't have to figure out what your page means. Clarity issues at the top of the page reduce the effectiveness of everything below — proof, features, pricing — because visitors have already lost confidence in whether this is for them.

---

OPTIONAL IMPROVEMENTS

• Pricing placement (show earlier if converting to signups is the goal)
• Trust signal timing (move proof closer to the first ask)
• Section order (problem before solution, always)
• Testimonials (specificity over volume)

---

You can absolutely implement this yourself.

But if you want, I can just fix it for you.

I'll rewrite your homepage so:

• it's immediately clear what you do
• people understand the value in seconds
• and your CTAs make sense

Usually takes me 24–48 hours.

→ Get my page fixed: ${params.paymentLink}
`.trim(),
};

// ─── Follow-up sequence ───────────────────────────────────────────────────────

export const FOLLOWUP_1 = {
  // Send ~24 hours after Fix Plan delivery
  subject: "Quick one",

  body: (pageUrl: string): string => `
Hey — did you get a chance to look at the fixes I sent for ${pageUrl}?

Happy to answer any questions if anything was unclear.
`.trim(),
};

export const FOLLOWUP_2 = {
  // Send ~72 hours after Fix Plan delivery
  subject: "Re: your homepage",

  body: (_pageUrl: string): string => `
Most people get stuck at the "actually rewriting it" part.

If you want, I can just handle it for you. One less thing on the list.

Reply here if you want to move forward and I'll get started.
`.trim(),
};

export const FOLLOWUP_3 = {
  // Send ~7 days after Fix Plan delivery
  subject: "Still on your list?",

  body: (pageUrl: string): string => `
Out of curiosity — are you still working on improving ${pageUrl}?

Happy to take it off your plate if it's still on your list.
`.trim(),
};
