import { getReport, getSubmission, flagReport } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await getReport(id);

  // Try to find by report ID or submission ID
  if (!report) notFound();

  const submission = await getSubmission(report.submission_id);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin/reports"
            className="text-xs text-stone-400 hover:text-stone-700 underline"
          >
            ← Back to reports
          </Link>
          <h1 className="mt-2 text-base font-semibold text-stone-900">
            Report: {submission?.url ?? report.submission_id}
          </h1>
          <div className="mt-1 flex gap-3 text-xs text-stone-500">
            <span>Score: {report.overall_score}/100</span>
            <span>Tier: {report.tier}</span>
            {report.flagged && (
              <span className="text-yellow-700 font-semibold">FLAGGED</span>
            )}
          </div>
        </div>
        <Link
          href={`/report/${report.submission_id}`}
          className="flex-shrink-0 rounded bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-stone-700 transition-colors"
        >
          View public report
        </Link>
      </div>

      {/* Report overview */}
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Summary
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-stone-800">
          {report.executive_summary}
        </p>
        {report.fix_first && (
          <div className="rounded border border-stone-200 bg-stone-50 p-3">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Fix first
            </div>
            <p className="text-sm text-stone-700">{report.fix_first}</p>
          </div>
        )}
      </div>

      {/* Tier breakdown */}
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Issues
        </h2>
        <div className="space-y-6">
          <IssueList
            title="Tier 1 — Critical"
            issues={report.tier1_blockers ?? []}
          />
          <IssueList
            title="Tier 2 — High"
            issues={report.tier2_friction ?? []}
          />
          <IssueList
            title="Tier 3 — Medium/Low"
            issues={report.tier3_polish ?? []}
          />
        </div>
      </div>

      {/* Raw JSON for deep inspection */}
      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-stone-500">
          Full Report JSON
        </h2>
        <pre className="rounded border border-stone-200 bg-stone-50 p-4 text-[11px] text-stone-700 overflow-auto max-h-96 whitespace-pre-wrap">
          {JSON.stringify(report, null, 2)}
        </pre>
      </div>
    </div>
  );
}

function IssueList({
  title,
  issues,
}: {
  title: string;
  issues: Array<{ title: string; severity: string; dimension: string; observation: string }>;
}) {
  if (issues.length === 0) return null;

  return (
    <div>
      <div className="mb-3 text-xs font-semibold text-stone-500">{title}</div>
      <div className="space-y-2">
        {issues.map((issue, i) => (
          <div
            key={i}
            className="rounded border border-stone-100 bg-stone-50 px-4 py-3"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0 text-[10px] font-semibold uppercase text-stone-400">
                {issue.severity}
              </span>
              <div>
                <div className="text-sm font-medium text-stone-900">{issue.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-stone-600">
                  {issue.observation}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
