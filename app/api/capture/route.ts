import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";

const CaptureSchema = z.object({
  email: z.email("Invalid email address").max(254),
  url: z.string().max(2000),
  wantsFullReport: z.boolean().optional().default(false),
  analysisId: z.uuid().nullable().optional(),
});

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  // Rate limit by IP — 10 per hour
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { allowed } = checkRateLimit(`capture:${ip}`, 10, 60 * 60 * 1000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = CaptureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { email, url, wantsFullReport, analysisId } = parsed.data;

  // Rate limit by email — 3 per hour (prevent one address spamming)
  const { allowed: emailAllowed } = checkRateLimit(
    `capture:email:${email.toLowerCase()}`,
    3,
    60 * 60 * 1000
  );
  if (!emailAllowed) {
    // Return 200 so we don't leak that this email has been seen
    return NextResponse.json({ success: true });
  }

  try {
    const supabase = getClient();
    const { error } = await supabase
      .from("rewrite_requests")
      .insert({ email, url, wants_full_report: wantsFullReport, analysis_id: analysisId ?? null });

    if (error) {
      console.error("[capture] Insert failed");
      return NextResponse.json({ error: "Failed to save. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error("[capture] Unexpected error");
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
