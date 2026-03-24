import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// import { checkRateLimit } from "@/lib/rate-limit"; // temporarily disabled
import { assertSafeUrl } from "@/lib/security/ssrf-guard";
import {
  createSubmission,
  updateSubmissionStatus,
  savePageSnapshot,
  saveReport,
  saveAnalysis,
  setSubmissionAnalysisId,
} from "@/lib/db";
import { fetchPage } from "@/lib/parsing/fetcher";
import { extractPageData } from "@/lib/parsing/extractor";
import { normalizePageData } from "@/lib/parsing/normalizer";
// import { captureScreenshot } from "@/lib/parsing/screenshotter"; // temporarily disabled
import { runDiagnosisPipeline } from "@/lib/ai/pipeline";

const RequestSchema = z.object({
  url: z.url("Please enter a valid URL"),
  desired_action: z.string().max(200).optional(),
  target_audience: z.string().max(200).optional(),
  business_type: z.string().max(200).optional(),
  visitor_temp: z.enum(["cold", "warm", "hot"]).optional(),
  biggest_concern: z.string().max(300).optional(),
});

export async function POST(req: NextRequest) {
  // ── Rate limiting (TEMPORARILY DISABLED FOR DEBUGGING) ──
  // const ip =
  //   req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
  //   req.headers.get("x-real-ip") ??
  //   "unknown";

  // const { allowed } = checkRateLimit(ip, 5, 60 * 60 * 1000); // 5 per hour per IP
  // if (!allowed) {
  //   return NextResponse.json(
  //     { error: "Too many requests. Please wait before submitting again." },
  //     { status: 429 }
  //   );
  // }

  console.log("Diagnose request received");

  // ── Parse and validate request ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  // ── SSRF pre-check — validate URL is safe before creating any record ──
  try {
    await assertSafeUrl(data.url);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Invalid URL." },
      { status: 400 }
    );
  }

  // ── Create submission record ──
  let submission;
  try {
    submission = await createSubmission(data);
  } catch (err) {
    console.error("Failed to create submission:", err);
    return NextResponse.json(
      { error: "Failed to initialize analysis. Please try again." },
      { status: 500 }
    );
  }

  // ── Respond immediately — run pipeline in background ──
  const response = NextResponse.json(
    { submission_id: submission.id },
    { status: 202 }
  );

  runPipeline(submission.id, submission.url, data).catch((err) => {
    console.error(`Pipeline failed for submission ${submission.id}:`, err);
  });

  return response;
}

async function runPipeline(
  submissionId: string,
  url: string,
  data: z.infer<typeof RequestSchema>
) {
  try {
    console.log(`STEP 1: starting fetch [${submissionId}]`);
    await updateSubmissionStatus(submissionId, "scraping");

    let fetched: Awaited<ReturnType<typeof fetchPage>>;
    try {
      fetched = await fetchPage(url);
      console.log(`STEP 2: fetched HTML [${submissionId}] finalUrl=${fetched.finalUrl}`);
    } catch (err) {
      console.error(`PIPELINE ERROR at STEP 2 (fetchPage) [${submissionId}]:`, err instanceof Error ? err.message : err);
      throw err;
    }

    console.log(`STEP 3: starting analysis (extract + normalize) [${submissionId}]`);
    let rawData: ReturnType<typeof extractPageData>;
    let screenshotBase64: string | null;
    try {
      [rawData, screenshotBase64] = await Promise.all([
        Promise.resolve(extractPageData(fetched.html)),
        Promise.resolve(null), // captureScreenshot temporarily disabled
      ]);
      console.log(`STEP 3: done — wordCount=${rawData.wordCount}, screenshot=${screenshotBase64 ? "yes" : "null"} [${submissionId}]`);
    } catch (err) {
      console.error(`PIPELINE ERROR at STEP 3 (extractPageData) [${submissionId}]:`, err instanceof Error ? err.message : err);
      throw err;
    }

    const normalized = normalizePageData(submissionId, rawData);
    const snapshot = await savePageSnapshot(normalized);

    await updateSubmissionStatus(submissionId, "diagnosing");

    const fullSubmission = {
      id: submissionId,
      url,
      status: "diagnosing" as const,
      error: null,
      page_type: null,
      analysis_id: null,
      desired_action: data.desired_action ?? null,
      target_audience: data.target_audience ?? null,
      business_type: data.business_type ?? null,
      visitor_temp: data.visitor_temp ?? null,
      biggest_concern: data.biggest_concern ?? null,
      created_at: new Date().toISOString(),
      completed_at: null,
    };

    console.log(`STEP 4: starting AI [${submissionId}]`);
    let report: Awaited<ReturnType<typeof runDiagnosisPipeline>>["report"];
    let analysisJson: Awaited<ReturnType<typeof runDiagnosisPipeline>>["analysisJson"];
    try {
      ({ report, analysisJson } = await runDiagnosisPipeline(snapshot, fullSubmission, screenshotBase64));
      console.log(`STEP 5: AI response received [${submissionId}] tier=${report.tier} score=${report.overall_score}`);
    } catch (err) {
      console.error(`PIPELINE ERROR at STEP 4–5 (runDiagnosisPipeline) [${submissionId}]:`, err instanceof Error ? err.message : err);
      throw err;
    }

    console.log(`STEP 6: saving result [${submissionId}]`);
    await saveReport(report);

    const analysisId = await saveAnalysis({
      url,
      analysis_json: analysisJson,
      dominant_issue: analysisJson.dominant_issue,
      core_problem: analysisJson.core_problem,
      primary_blocker: analysisJson.primary_blocker?.title ?? null,
    });

    await setSubmissionAnalysisId(submissionId, analysisId);
    console.log(`STEP 6: done — analysisId=${analysisId} [${submissionId}]`);

    console.log(`STEP 7: marking job complete [${submissionId}]`);
    await updateSubmissionStatus(submissionId, "complete", {
      page_type: report.sections[0]?.dimension ?? undefined,
      completed: true,
    });
    console.log(`REPORT STATUS: COMPLETE [${submissionId}]`);

    console.log(`STEP 8: DONE [${submissionId}]`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`PIPELINE ERROR [${submissionId}]:`, message);
    await updateSubmissionStatus(submissionId, "failed", {
      error: message,
    }).catch(() => {});
  }
}