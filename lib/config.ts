// ─── Funnel Configuration ─────────────────────────────────────────────────────
// Update these values to change pricing and copy across the funnel.
// Do not scatter pricing strings across multiple files — change it here.

// ─── Rewrite Pricing ─────────────────────────────────────────────────────────
//
// Early-stage pricing is intentionally set to $29.
//
// This is not optimized for profit yet. It is optimized for:
//   - fast learning (low barrier = more reps and more signal)
//   - validating willingness to pay at the earliest stage
//   - increasing conversion volume during early testing
//
// Why not higher:
//   - no testimonials yet
//   - no conversion proof yet
//   - ICP and delivery process are still being refined
//   - the offer needs to earn its price through results first
//
// Why not lower:
//   - too low weakens signal quality (free-tier intent is meaningless)
//   - $29 is enough to confirm real intent without creating meaningful friction
//   - anything under $20 starts to feel like a trial, not a real service
//
// This should be raised (probably to $97–$197) after:
//   - several successful deliveries
//   - at least 2–3 testimonials or case results
//   - clear ICP is confirmed
//
export const REWRITE_PRICE = 29;
export const REWRITE_PRICE_DISPLAY = `$${REWRITE_PRICE}`;

// TODO: Set to a Stripe payment link URL when payment is ready.
// Format: "https://buy.stripe.com/..."
export const STRIPE_PAYMENT_LINK: string | null = null;
