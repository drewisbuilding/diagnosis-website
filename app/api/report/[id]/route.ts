import { NextRequest, NextResponse } from "next/server";
import { getSubmission, getReport } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
  }

  const submission = await getSubmission(id);

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  let report = null;
  if (submission.status === "complete") {
    report = await getReport(id);
  }

  return NextResponse.json({
    status: submission.status,
    report,
    submission: {
      url: submission.url,
      desired_action: submission.desired_action,
      page_type: submission.page_type,
      created_at: submission.created_at,
      analysis_id: submission.analysis_id,
    },
    error: submission.error,
  });
}
