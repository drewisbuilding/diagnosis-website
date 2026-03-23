import type { PageType } from "@/lib/types";

// ─── Page Type Heuristics ─────────────────────────────────────────────────────
// Used to classify a URL and its content before diagnosis.
// Page type affects which rubric dimensions are weighted most heavily
// and which archetypes are most likely relevant.

export interface PageTypeProfile {
  label: string;
  description: string;
  primary_goal: string;
  url_patterns: RegExp[];
  content_signals: string[];
  // Dimension weight modifiers — positive or negative adjustments
  // to the base rubric weights when this page type is detected.
  // These are relative adjustments, not absolute values.
  high_priority_dimensions: string[];
  lower_priority_dimensions: string[];
}

export const PAGE_TYPE_PROFILES: Record<PageType, PageTypeProfile> = {
  landing: {
    label: "Landing Page",
    description:
      "Standalone page optimized for a single conversion action, typically from a paid campaign",
    primary_goal: "Convert a visitor from a specific traffic source to a specific action",
    url_patterns: [/\/landing/i, /\/lp\//i, /\/campaign/i, /\/go\//i, /\/try/i, /\/start/i],
    content_signals: [
      "Single CTA repeated multiple times",
      "No navigation menu",
      "Specific campaign-match messaging",
      "Short, focused page with one clear offer",
    ],
    high_priority_dimensions: ["headline_clarity", "cta_strength", "offer_clarity", "friction"],
    lower_priority_dimensions: ["flow", "differentiation"],
  },

  homepage: {
    label: "Homepage",
    description:
      "The primary domain root — serves multiple audiences and multiple goals simultaneously",
    primary_goal: "Orient visitors, communicate brand value, route to appropriate next steps",
    url_patterns: [/^\/$/, /^\/home$/i, /^\/index/i],
    content_signals: [
      "Navigation with multiple sections",
      "Multiple CTAs for different audiences",
      "Brand story or company overview",
      "Multiple product or service categories",
    ],
    high_priority_dimensions: ["headline_clarity", "value_proposition", "message_hierarchy", "differentiation"],
    lower_priority_dimensions: ["cta_strength", "offer_clarity"],
  },

  pricing: {
    label: "Pricing Page",
    description: "Page where visitors evaluate plans and make a purchase or trial decision",
    primary_goal: "Convert a visitor who already understands the product to a paid or trial commitment",
    url_patterns: [/\/pricing/i, /\/plans/i, /\/upgrade/i, /\/subscribe/i],
    content_signals: [
      "Price figures or plan tiers",
      "Feature comparison table",
      "'Most popular' or 'Recommended' tier callout",
      "FAQ about billing or cancellation",
    ],
    high_priority_dimensions: ["offer_clarity", "trust_signals", "cta_strength", "friction"],
    lower_priority_dimensions: ["headline_clarity", "flow"],
  },

  product: {
    label: "Product Page",
    description: "Detailed page for a specific product, typically in e-commerce or SaaS",
    primary_goal: "Provide enough context and proof to drive a purchase or demo request",
    url_patterns: [/\/product\//i, /\/products\//i, /\/item\//i, /\/p\//i],
    content_signals: [
      "Product images or screenshots",
      "Technical specifications",
      "Add to cart or buy now CTA",
      "Reviews or ratings",
    ],
    high_priority_dimensions: ["offer_clarity", "proof_placement", "cta_strength", "trust_signals"],
    lower_priority_dimensions: ["differentiation", "flow"],
  },

  sales: {
    label: "Sales / VSL Page",
    description:
      "Long-form sales page designed to build belief over the course of a scrolling narrative",
    primary_goal: "Build enough belief and desire to drive a direct purchase or application",
    url_patterns: [/\/sales/i, /\/order/i, /\/enroll/i, /\/join/i, /\/apply/i],
    content_signals: [
      "Long single-column narrative",
      "Explicit problem/agitation/solution structure",
      "Multiple testimonials with results",
      "Price reveal late in the page",
      "FAQ or objection-handling section",
    ],
    high_priority_dimensions: ["flow", "proof_placement", "trust_signals", "offer_clarity"],
    lower_priority_dimensions: ["message_hierarchy", "friction"],
  },

  other: {
    label: "Other",
    description: "Page type not clearly matching the above categories",
    primary_goal: "Unclear or mixed",
    url_patterns: [],
    content_signals: [],
    high_priority_dimensions: ["headline_clarity", "value_proposition", "cta_strength"],
    lower_priority_dimensions: [],
  },
};

// ─── Classification Logic ─────────────────────────────────────────────────────

export function classifyByUrl(url: string): PageType | null {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.toLowerCase();

    // Check exact homepage patterns first
    if (path === "/" || path === "" || path === "/index.html") {
      return "homepage";
    }

    // Check each type's URL patterns
    for (const [type, profile] of Object.entries(PAGE_TYPE_PROFILES)) {
      if (type === "other") continue;
      for (const pattern of profile.url_patterns) {
        if (pattern.test(path)) {
          return type as PageType;
        }
      }
    }

    return null;
  } catch {
    return null;
  }
}
