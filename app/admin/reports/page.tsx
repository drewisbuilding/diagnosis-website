import { listReports } from "@/lib/db";
import Link from "next/link";

export const revalidate = 0;

export default async function AdminReportsPage() {
  const reports = await listReports(100);

  const avgScore =
    reports.length > 0
      ? Math.round(reports.reduce((sum, r) => sum + r.overall_score, 0) / reports.length)
      : null;

  const tierCounts = reports.reduce(
    (acc, r) => {
      acc[r.tier] = (acc[r.tier] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 text-lg font-semibold text-stone-900">Reports</h1>
        <div className="flex gap-4 text-sm text-stone-500">
          <span>{reports.length} total</span>
          {avgScore !== null && <span>avg score: {avgScore}</span>}
          {Object.entries(tierCounts).map(([tier, count]) => (
            <span key={tier}>
              {tier}: {count}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {reports.length === 0 && (
          <div className="rounded-lg border border-stone-200 bg-white px-6 py-12 text-center text-sm text-stone-400">
            No reports generated yet.
          </div>
        )}
        {reports.map((report) => {
          const tierColor: Record<string, string> = {
            critical: "text-red-600",
            "needs-work": "text-amber-600",
            solid: "text-blue-600",
            optimized: "text-green-600",
          };

          return (
            <div
              key={report.id}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-5 py-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-lg font-light ${tierColor[report.tier]}`}>
                    {report.overall_score}
                  </span>
                  <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">
                    {report.tier}
                  </span>
                  {report.flagged && (
                    <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700 uppercase">
                      Flagged
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-stone-800 truncate">
                  {report.submission_url}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-stone-500 line-clamp-2">
                  {report.executive_summary}
                </p>
              </div>
              <div className="ml-6 flex flex-col gap-2 flex-shrink-0 text-right">
                <Link
                  href={`/report/${report.submission_id}`}
                  className="text-xs text-stone-600 underline hover:text-stone-900"
                >
                  View report
                </Link>
                <Link
                  href={`/admin/reports/${report.id}`}
                  className="text-xs text-stone-400 underline hover:text-stone-700"
                >
                  Inspect
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
