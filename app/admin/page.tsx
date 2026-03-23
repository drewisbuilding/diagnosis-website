import { listSubmissions } from "@/lib/db";
import Link from "next/link";
import type { Submission } from "@/lib/types";

export const revalidate = 0; // Always fresh

export default async function AdminSubmissionsPage() {
  const submissions = await listSubmissions(100);

  const statusCounts = submissions.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="mb-1 text-lg font-semibold text-stone-900">Submissions</h1>
        <div className="flex gap-4 text-sm text-stone-500">
          <span>{submissions.length} total</span>
          {statusCounts.complete && <span className="text-green-700">{statusCounts.complete} complete</span>}
          {statusCounts.failed && <span className="text-red-700">{statusCounts.failed} failed</span>}
          {statusCounts.diagnosing && <span className="text-amber-700">{statusCounts.diagnosing} in progress</span>}
        </div>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-stone-200 bg-stone-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                URL
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                Submitted
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {submissions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-stone-400">
                  No submissions yet.
                </td>
              </tr>
            )}
            {submissions.map((s) => (
              <SubmissionRow key={s.id} submission={s} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubmissionRow({ submission: s }: { submission: Submission }) {
  const statusStyles: Record<string, string> = {
    pending: "bg-stone-100 text-stone-600",
    scraping: "bg-blue-100 text-blue-700",
    diagnosing: "bg-amber-100 text-amber-700",
    complete: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  const hostname = (() => {
    try {
      return new URL(s.url).hostname;
    } catch {
      return s.url;
    }
  })();

  const timeAgo = formatTimeAgo(s.created_at);

  return (
    <tr className="hover:bg-stone-50">
      <td className="px-4 py-3">
        <div className="font-medium text-stone-900 truncate max-w-xs" title={s.url}>
          {hostname}
        </div>
        <div className="text-xs text-stone-400 truncate max-w-xs" title={s.url}>
          {s.url}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles[s.status] ?? "bg-stone-100 text-stone-600"}`}
        >
          {s.status}
        </span>
        {s.error && (
          <div className="mt-1 text-[10px] text-red-600 max-w-xs truncate" title={s.error}>
            {s.error}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-stone-500">{s.page_type ?? "—"}</td>
      <td className="px-4 py-3 text-xs text-stone-500">{timeAgo}</td>
      <td className="px-4 py-3">
        <div className="flex gap-3">
          {s.status === "complete" && (
            <Link
              href={`/report/${s.id}`}
              className="text-xs text-stone-600 underline hover:text-stone-900"
            >
              View report
            </Link>
          )}
          <Link
            href={`/admin/submissions/${s.id}`}
            className="text-xs text-stone-400 underline hover:text-stone-700"
          >
            Inspect
          </Link>
        </div>
      </td>
    </tr>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
