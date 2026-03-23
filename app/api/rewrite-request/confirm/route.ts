import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// TODO: When Stripe is ready, replace this with a Stripe checkout session creation.
// The flow should be:
//   1. Receive requestId
//   2. Create Stripe checkout session with metadata: { requestId }
//   3. Return { checkoutUrl } instead of { success: true }
//   4. Client redirects to Stripe
//   5. Stripe webhook (POST /api/webhooks/stripe) marks payment_intent = true

const ConfirmSchema = z.object({
  requestId: z.uuid(),
});

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = ConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
  }

  const { requestId } = parsed.data;

  try {
    const db = getServiceClient();
    const { error } = await db
      .from("page_fix_requests")
      .update({ payment_intent: true })
      .eq("id", requestId);

    if (error) {
      console.error("[rewrite-request/confirm] Update failed:", error.message);
      return NextResponse.json(
        { error: "Failed to confirm. Please try again." },
        { status: 500 }
      );
    }

    // TODO: Replace { success: true } with { checkoutUrl } when Stripe is ready
    return NextResponse.json({ success: true });
  } catch {
    console.error("[rewrite-request/confirm] Unexpected error");
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
