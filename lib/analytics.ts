// ─── Analytics ────────────────────────────────────────────────────────────────
// Lightweight event tracking stubs.
// Currently logs to console in development.
//
// TODO: Wire to an analytics provider when ready (PostHog, Plausible, Amplitude).
// Each call site is already instrumented — just update the implementation below.
//
// Key funnel events tracked:
//   diagnosis_viewed           — user lands on a completed report
//   rewrite_cta_clicked        — any of the 3 CTA variants clicked
//   email_capture_submitted    — email submitted via modal
//   rewrite_request_viewed     — /request-rewrite page loaded
//   rewrite_request_submitted  — request form submitted
//   offer_page_viewed          — /offer page loaded
//   payment_cta_clicked        — "Get my page fixed" clicked
//   payment_completed          — payment confirmed (when Stripe is wired)

export type AnalyticsEvent =
  | "diagnosis_viewed"
  | "rewrite_cta_clicked"
  | "email_capture_submitted"
  | "rewrite_request_viewed"
  | "rewrite_request_submitted"
  | "rewrite_request_save_failed"
  | "offer_page_viewed"
  | "payment_cta_clicked"
  | "payment_completed";

export type AnalyticsProperties = Record<string, string | number | boolean | null>;

export function trackEvent(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
  // TODO: replace with your analytics provider
  // Example (PostHog):
  //   posthog.capture(event, properties)
  // Example (Plausible):
  //   plausible(event, { props: properties })

  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.log(`[analytics] ${event}`, properties ?? "");
  }
}
