import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit } from "@/lib/rate-limit";

const RequestSchema = z.object({
  url: z.string().max(2000),
  email: z.email("Please enter a valid email address").max(254),
  goal: z.string().min(1, "Please describe your goal").max(500),
  notes: z.string().max(1000).optional(),
  analysisId: z.uuid().nullable().optional(),
});

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const { allowed } = checkRateLimit(`fix-request:${ip}`, 5, 60 * 60 * 1000);
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
    console.error("[rewrite-request] Failed to parse request body");
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    console.error("[rewrite-request] Validation failed:", {
      field: firstError?.path?.join("."),
      message: firstError?.message,
      issueCount: parsed.error.issues.length,
    });
    return NextResponse.json(
      { error: firstError?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { url, email, goal, notes, analysisId } = parsed.data;

  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("page_fix_requests")
      .insert({
        url,
        email,
        goal,
        notes: notes ?? null,
        analysis_id: analysisId ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[rewrite-request] DB insert failed:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        // Intentionally omitting email/url from logs for user privacy
        hasGoal: !!goal,
        hasAnalysisId: !!analysisId,
      });
      return NextResponse.json(
        { error: "Something went wrong while saving your request. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { request_id: (data as { id: string }).id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[rewrite-request] Unexpected error:", {
      type: err instanceof Error ? err.constructor.name : typeof err,
      message: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
