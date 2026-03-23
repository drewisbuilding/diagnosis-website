import * as cheerio from "cheerio";

// ─── Raw Extracted Data ───────────────────────────────────────────────────────
// This is the intermediate format — raw extraction before normalization.

export interface RawPageData {
  title: string | null;
  metaDescription: string | null;
  h1: string | null;
  h2s: string[];
  h3s: string[];
  ctaTexts: string[];
  navItems: string[];
  bodyText: string;
  testimonialSnippets: string[];
  pricingSnippets: string[];
  faqSnippets: string[];
  formFields: string[];
  wordCount: number;
}

// Selectors for elements we want to exclude from body text
const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "svg",
  "canvas",
  "code",
  "pre",
  "header",
  "footer",
  "nav",
  "[aria-hidden='true']",
  ".cookie-banner",
  ".cookie-notice",
  "#cookie",
  ".modal",
  ".popup",
];

// Selectors that likely indicate CTA buttons
const CTA_SELECTORS = [
  "a.btn",
  "a.button",
  "button",
  "[role='button']",
  "a[href*='signup']",
  "a[href*='register']",
  "a[href*='start']",
  "a[href*='trial']",
  "a[href*='demo']",
  "a[href*='buy']",
  "a[href*='get-started']",
  "a[href*='contact']",
  ".cta",
  ".cta-button",
  "[class*='cta']",
  "[class*='btn']",
];

// Signals for testimonials
const TESTIMONIAL_SELECTORS = [
  "blockquote",
  "[class*='testimonial']",
  "[class*='review']",
  "[class*='quote']",
  "[id*='testimonial']",
  "[data-testimonial]",
];

// Signals for pricing
const PRICING_SELECTORS = [
  "[class*='pricing']",
  "[class*='price']",
  "[class*='plan']",
  "[id*='pricing']",
  "[id*='price']",
];

// Signals for FAQ
const FAQ_SELECTORS = [
  "[class*='faq']",
  "[id*='faq']",
  "details",
  "[class*='accordion']",
  "[class*='question']",
];

export function extractPageData(html: string): RawPageData {
  const $ = cheerio.load(html);

  // ── Remove noise elements ──
  $(NOISE_SELECTORS.join(", ")).remove();

  // ── Title ──
  const title =
    $("title").first().text().trim() ||
    $('meta[property="og:title"]').attr("content")?.trim() ||
    null;

  // ── Meta description ──
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ||
    $('meta[property="og:description"]').attr("content")?.trim() ||
    null;

  // ── Headings ──
  const h1 = $("h1").first().text().trim() || null;
  const h2s = $("h2")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 20);
  const h3s = $("h3")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
    .slice(0, 20);

  // ── CTA texts ──
  const ctaTexts = extractUnique(
    $(CTA_SELECTORS.join(", "))
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((t) => t.length > 1 && t.length < 80)
  ).slice(0, 15);

  // ── Navigation ──
  const navItems = $("nav a, header a")
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 1 && t.length < 50)
    .slice(0, 15);

  // ── Testimonials ──
  const testimonialSnippets = $(TESTIMONIAL_SELECTORS.join(", "))
    .map((_, el) => $(el).text().trim().replace(/\s+/g, " "))
    .get()
    .filter((t) => t.length > 20 && t.length < 500)
    .slice(0, 5);

  // ── Pricing ──
  const pricingSnippets = $(PRICING_SELECTORS.join(", "))
    .map((_, el) => $(el).text().trim().replace(/\s+/g, " "))
    .get()
    .filter((t) => t.length > 10 && t.length < 300)
    .slice(0, 5);

  // ── FAQ ──
  const faqSnippets = $(FAQ_SELECTORS.join(", "))
    .map((_, el) => $(el).text().trim().replace(/\s+/g, " "))
    .get()
    .filter((t) => t.length > 20 && t.length < 400)
    .slice(0, 8);

  // ── Form fields ──
  const formFields = $("input[placeholder], input[name], textarea, select")
    .map((_, el) => {
      const $el = $(el);
      return (
        $el.attr("placeholder") ||
        $el.attr("aria-label") ||
        $el.attr("name") ||
        ""
      );
    })
    .get()
    .filter((t) => t.length > 0 && t.length < 100)
    .slice(0, 10);

  // ── Body text ──
  // Get clean text from main content areas
  const mainSelectors = ["main", "article", ".main", "#main", "#content", ".content", "body"];
  let bodyText = "";

  for (const sel of mainSelectors) {
    const el = $(sel).first();
    if (el.length > 0) {
      bodyText = el.text().trim().replace(/\s+/g, " ");
      if (bodyText.length > 200) break;
    }
  }

  // Fallback to body if main not found
  if (bodyText.length < 200) {
    bodyText = $("body").text().trim().replace(/\s+/g, " ");
  }

  // Truncate to avoid huge inputs to AI (roughly 6000 words max)
  const MAX_BODY_CHARS = 35000;
  if (bodyText.length > MAX_BODY_CHARS) {
    bodyText = bodyText.slice(0, MAX_BODY_CHARS) + "... [truncated]";
  }

  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  return {
    title,
    metaDescription,
    h1,
    h2s,
    h3s,
    ctaTexts,
    navItems,
    bodyText,
    testimonialSnippets,
    pricingSnippets,
    faqSnippets,
    formFields,
    wordCount,
  };
}

function extractUnique(arr: string[]): string[] {
  return [...new Set(arr)];
}
