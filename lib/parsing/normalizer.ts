import type { PageSnapshot } from "@/lib/types";
import type { RawPageData } from "./extractor";

// ─── Normalizer ───────────────────────────────────────────────────────────────
// Converts raw extracted data into the clean PageSnapshot shape.
// This is the boundary between messy real-world HTML and the
// structured object passed to the AI pipeline.

export function normalizePageData(
  submissionId: string,
  raw: RawPageData
): Omit<PageSnapshot, "id" | "scraped_at"> {
  return {
    submission_id: submissionId,
    title: cleanText(raw.title),
    meta_description: cleanText(raw.metaDescription),
    h1_text: cleanText(raw.h1),
    h2_texts: raw.h2s.map(cleanText).filter(isNonEmpty) as string[],
    h3_texts: raw.h3s.map(cleanText).filter(isNonEmpty) as string[],
    cta_texts: raw.ctaTexts.map(cleanText).filter(isNonEmpty) as string[],
    nav_items: raw.navItems.map(cleanText).filter(isNonEmpty) as string[],
    body_text: raw.bodyText,
    word_count: raw.wordCount,
    testimonial_snippets: raw.testimonialSnippets.map(cleanText).filter(isNonEmpty) as string[],
    pricing_snippets: raw.pricingSnippets.map(cleanText).filter(isNonEmpty) as string[],
    faq_snippets: raw.faqSnippets.map(cleanText).filter(isNonEmpty) as string[],
    form_fields: raw.formFields.map(cleanText).filter(isNonEmpty) as string[],
  };
}

// ─── Serializer ───────────────────────────────────────────────────────────────
// Converts a PageSnapshot into a structured text block suitable for
// injection into AI prompts. This is what the AI actually reads.

export function serializeSnapshotForPrompt(snapshot: PageSnapshot): string {
  const lines: string[] = [];

  lines.push("=== PAGE CONTENT SNAPSHOT ===");
  lines.push("");

  if (snapshot.title) {
    lines.push(`PAGE TITLE: ${snapshot.title}`);
  }

  if (snapshot.meta_description) {
    lines.push(`META DESCRIPTION: ${snapshot.meta_description}`);
  }

  if (snapshot.h1_text) {
    lines.push(`H1 HEADLINE: ${snapshot.h1_text}`);
  }

  if (snapshot.h2_texts.length > 0) {
    lines.push(`H2 SUBHEADINGS: ${snapshot.h2_texts.join(" | ")}`);
  }

  if (snapshot.h3_texts.length > 0) {
    lines.push(`H3 HEADINGS: ${snapshot.h3_texts.join(" | ")}`);
  }

  if (snapshot.cta_texts.length > 0) {
    lines.push(`CTA / BUTTON TEXT: ${snapshot.cta_texts.join(" | ")}`);
  }

  if (snapshot.nav_items.length > 0) {
    lines.push(`NAVIGATION ITEMS: ${snapshot.nav_items.join(" | ")}`);
  }

  if (snapshot.testimonial_snippets.length > 0) {
    lines.push("");
    lines.push("TESTIMONIAL SNIPPETS:");
    snapshot.testimonial_snippets.forEach((t, i) => {
      lines.push(`  [${i + 1}] ${t}`);
    });
  }

  if (snapshot.pricing_snippets.length > 0) {
    lines.push("");
    lines.push("PRICING CONTENT:");
    snapshot.pricing_snippets.forEach((p, i) => {
      lines.push(`  [${i + 1}] ${p}`);
    });
  }

  if (snapshot.faq_snippets.length > 0) {
    lines.push("");
    lines.push("FAQ / Q&A CONTENT:");
    snapshot.faq_snippets.forEach((f, i) => {
      lines.push(`  [${i + 1}] ${f}`);
    });
  }

  if (snapshot.form_fields.length > 0) {
    lines.push("");
    lines.push(`FORM FIELDS: ${snapshot.form_fields.join(" | ")}`);
  }

  lines.push("");
  lines.push("FULL PAGE TEXT:");
  lines.push(snapshot.body_text);

  return lines.join("\n");
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cleanText(text: string | null): string | null {
  if (!text) return null;
  return text.replace(/\s+/g, " ").trim() || null;
}

function isNonEmpty(value: string | null): value is string {
  return value !== null && value.length > 0;
}
