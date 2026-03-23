import { createClient } from "@supabase/supabase-js";
import type {
  Submission,
  PageSnapshot,
  Report,
  DiagnoseRequest,
  SubmissionStatus,
} from "@/lib/types";
import type { AnalysisJson } from "@/lib/ai/pipeline";

// ─── Client ───────────────────────────────────────────────────────────────────

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export async function createSubmission(
  data: DiagnoseRequest
): Promise<Submission> {
  const db = getServiceClient();

  const { data: row, error } = await db
    .from("submissions")
    .insert({
      url: data.url,
      status: "pending",
      desired_action: data.desired_action ?? null,
      target_audience: data.target_audience ?? null,
      business_type: data.business_type ?? null,
      visitor_temp: data.visitor_temp ?? null,
      biggest_concern: data.biggest_concern ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create submission: ${error.message}`);
  return row as Submission;
}

export async function updateSubmissionStatus(
  id: string,
  status: SubmissionStatus,
  opts?: { error?: string; page_type?: string; completed?: boolean }
): Promise<void> {
  const db = getServiceClient();

  const updates: Record<string, unknown> = { status };
  if (opts?.error) updates.error = opts.error;
  if (opts?.page_type) updates.page_type = opts.page_type;
  if (opts?.completed) updates.completed_at = new Date().toISOString();

  const { error } = await db
    .from("submissions")
    .update(updates)
    .eq("id", id);

  if (error)
    throw new Error(`Failed to update submission status: ${error.message}`);
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Submission;
}

export async function listSubmissions(limit = 50): Promise<Submission[]> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return data as Submission[];
}

// ─── Analyses ─────────────────────────────────────────────────────────────────

export interface AnalysisRecord {
  url: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  analysis_json: Record<string, any>;
  dominant_issue?: string | null;
  core_problem?: string | null;
  primary_blocker?: string | null;
}

export async function saveAnalysis(data: AnalysisRecord): Promise<string> {
  const db = getServiceClient();
  const { data: row, error } = await db
    .from("analyses")
    .insert(data)
    .select("id")
    .single();
  if (error) throw new Error(`Failed to save analysis: ${error.message}`);
  return (row as { id: string }).id;
}

export async function setSubmissionAnalysisId(
  submissionId: string,
  analysisId: string
): Promise<void> {
  const db = getServiceClient();
  const { error } = await db
    .from("submissions")
    .update({ analysis_id: analysisId })
    .eq("id", submissionId);
  if (error) throw new Error(`Failed to set analysis_id: ${error.message}`);
}

// ─── Page Snapshots ───────────────────────────────────────────────────────────

export async function savePageSnapshot(
  snapshot: Omit<PageSnapshot, "id" | "scraped_at">
): Promise<PageSnapshot> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("page_snapshots")
    .insert(snapshot)
    .select()
    .single();

  if (error) throw new Error(`Failed to save page snapshot: ${error.message}`);
  return data as PageSnapshot;
}

export async function getPageSnapshot(
  submissionId: string
): Promise<PageSnapshot | null> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("page_snapshots")
    .select("*")
    .eq("submission_id", submissionId)
    .single();

  if (error) return null;
  return data as PageSnapshot;
}

// ─── Reports ──────────────────────────────────────────────────────────────────

export async function saveReport(
  report: Omit<Report, "id" | "created_at">
): Promise<Report> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("reports")
    .insert({
      submission_id: report.submission_id,
      overall_score: report.overall_score,
      tier: report.tier,
      title: report.title,
      executive_summary: report.executive_summary,
      core_problem: report.core_problem,
      visitor_journey: report.visitor_journey,
      primary_direction: report.primary_direction,
      problem_type: report.problem_type,
      whats_working: report.whats_working,
      tier1_blockers: report.tier1_blockers,
      tier2_friction: report.tier2_friction,
      tier3_polish: report.tier3_polish,
      intent_vs_reality: report.intent_vs_reality ?? null,
      fix_first: report.fix_first,
      cta_transition: report.cta_transition,
      strategic_note: report.strategic_note,
      sections: report.sections,
      pipeline_meta: report.pipeline_meta ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save report: ${error.message}`);
  return data as Report;
}

export async function getReport(submissionId: string): Promise<Report | null> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("reports")
    .select("*")
    .eq("submission_id", submissionId)
    .single();

  if (error) return null;
  return data as Report;
}

export async function listReports(limit = 50): Promise<
  Array<Report & { submission_url: string }>
> {
  const db = getServiceClient();
  const { data, error } = await db
    .from("reports")
    .select(
      `
      *,
      submissions!inner(url)
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];

  return data.map((r: Record<string, unknown>) => ({
    ...(r as unknown as Report),
    submission_url: (r.submissions as { url: string })?.url ?? "",
  }));
}

export async function flagReport(
  reportId: string,
  flagged: boolean,
  note?: string
): Promise<void> {
  const db = getServiceClient();
  const { error } = await db
    .from("reports")
    .update({ flagged, flag_note: note ?? null })
    .eq("id", reportId);

  if (error) throw new Error(`Failed to flag report: ${error.message}`);
}

// ─── Fulfillment Retrieval ─────────────────────────────────────────────────────
// Used to pull the exact saved analysis for manual or semi-automated fulfillment.
// Given a rewrite_request id, returns email + url + the linked analysis_json.
//
// Example usage:
//   const req = await getRewriteRequestWithAnalysis(42);
//   req.analysis.analysis_json  // AnalysisJson — source of truth for the rewrite

export interface RewriteRequestWithAnalysis {
  id: number;
  email: string;
  url: string;
  wants_full_report: boolean;
  analysis_id: string | null;
  created_at: string;
  analysis: {
    id: string;
    url: string;
    analysis_json: AnalysisJson;
    dominant_issue: string | null;
    core_problem: string | null;
    primary_blocker: string | null;
    created_at: string;
  } | null;
}

export async function getRewriteRequestWithAnalysis(
  requestId: number
): Promise<RewriteRequestWithAnalysis | null> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("rewrite_requests")
    .select(
      `
      id,
      email,
      url,
      wants_full_report,
      analysis_id,
      created_at,
      analyses (
        id,
        url,
        analysis_json,
        dominant_issue,
        core_problem,
        primary_blocker,
        created_at
      )
    `
    )
    .eq("id", requestId)
    .single();

  if (error) return null;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as number,
    email: row.email as string,
    url: row.url as string,
    wants_full_report: row.wants_full_report as boolean,
    analysis_id: row.analysis_id as string | null,
    created_at: row.created_at as string,
    analysis: row.analyses as RewriteRequestWithAnalysis["analysis"],
  };
}

export async function getAnalysisById(
  analysisId: string
): Promise<AnalysisJson | null> {
  const db = getServiceClient();

  const { data, error } = await db
    .from("analyses")
    .select("analysis_json")
    .eq("id", analysisId)
    .single();

  if (error) return null;
  return (data as { analysis_json: AnalysisJson }).analysis_json;
}
