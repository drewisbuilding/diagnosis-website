import { getSubmission, getPageSnapshot, getReport } from "@/lib/db";
import Link from "next/link";
import { notFound } from "next/navigation";

export const revalidate = 0;

export default async function AdminSubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const submission = await getSubmission(id);
  if (!submission) notFound();

  const [snapshot, report] = await Promise.all([
    getPageSnapshot(id),
    getReport(id),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/admin"
            className="text-xs text-stone-400 hover:text-stone-700 underline"
          >
            ← Back to submissions
          </Link>
          <h1 className="mt-2 text-base font-semibold text-stone-900 break-all">
            {submission.url}
          </h1>
          <div className="mt-1 flex gap-3 text-xs text-stone-500">
            <span>{submission.id}</span>
            <span>Status: {submission.status}</span>
            {submission.page_type && <span>Type: {submission.page_type}</span>}
          </div>
        </div>
        {report && (
          <Link
            href={`/report/${submission.id}`}
            className="flex-shrink-0 rounded bg-stone-900 px-4 py-2 text-xs font-medium text-white hover:bg-stone-700 transition-colors"
          >
            View report
          </Link>
        )}
      </div>

      {/* Submission Context */}
      <Section title="Submission Context">
        <DataGrid
          items={[
            { label: "Desired action", value: submission.desired_action },
            { label: "Target audience", value: submission.target_audience },
            { label: "Business type", value: submission.business_type },
            { label: "Visitor temp", value: submission.visitor_temp },
            { label: "Biggest concern", value: submission.biggest_concern },
            { label: "Submitted", value: submission.created_at },
            { label: "Completed", value: submission.completed_at },
            { label: "Error", value: submission.error },
          ]}
        />
      </Section>

      {/* Page Snapshot */}
      {snapshot ? (
        <Section title="Parsed Page Snapshot">
          <DataGrid
            items={[
              { label: "Title", value: snapshot.title },
              { label: "Meta description", value: snapshot.meta_description },
              { label: "H1", value: snapshot.h1_text },
              { label: "Word count", value: String(snapshot.word_count) },
              { label: "H2s", value: snapshot.h2_texts?.join(" | ") },
              { label: "CTAs", value: snapshot.cta_texts?.join(" | ") },
              { label: "Nav items", value: snapshot.nav_items?.join(" | ") },
              { label: "Form fields", value: snapshot.form_fields?.join(" | ") },
              {
                label: "Testimonials found",
                value: String(snapshot.testimonial_snippets?.length ?? 0),
              },
              {
                label: "Pricing snippets",
                value: String(snapshot.pricing_snippets?.length ?? 0),
              },
            ]}
          />
          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Body text (first 1000 chars)
            </div>
            <pre className="rounded border border-stone-200 bg-stone-50 p-3 text-[11px] text-stone-700 overflow-auto max-h-48 whitespace-pre-wrap">
              {snapshot.body_text?.slice(0, 1000)}…
            </pre>
          </div>
        </Section>
      ) : (
        <Section title="Page Snapshot">
          <p className="text-sm text-stone-400">No snapshot captured yet.</p>
        </Section>
      )}

      {/* Report Summary */}
      {report ? (
        <Section title="Report Summary">
          <DataGrid
            items={[
              { label: "Score", value: `${report.overall_score}/100` },
              { label: "Tier", value: report.tier },
              { label: "Fix first", value: report.fix_first },
              {
                label: "Tier 1 blockers",
                value: String(report.tier1_blockers?.length ?? 0),
              },
              {
                label: "Tier 2 friction",
                value: String(report.tier2_friction?.length ?? 0),
              },
              {
                label: "Flagged",
                value: report.flagged ? "Yes" : "No",
              },
            ]}
          />
          <div className="mt-4">
            <div className="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">
              Executive summary
            </div>
            <p className="text-sm leading-relaxed text-stone-700">
              {report.executive_summary}
            </p>
          </div>
          {report.pipeline_meta && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Pipeline metadata
              </div>
              <pre className="rounded border border-stone-200 bg-stone-50 p-3 text-[11px] text-stone-600 overflow-auto">
                {JSON.stringify(report.pipeline_meta, null, 2)}
              </pre>
            </div>
          )}
        </Section>
      ) : (
        <Section title="Report">
          <p className="text-sm text-stone-400">
            {submission.status === "complete"
              ? "Report missing despite complete status — check logs."
              : "Report not yet generated."}
          </p>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-6">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-stone-500">
        {title}
      </h2>
      {children}
    </div>
  );
}

function DataGrid({
  items,
}: {
  items: Array<{ label: string; value: string | null | undefined }>;
}) {
  const filled = items.filter((i) => i.value);
  if (filled.length === 0) return <p className="text-sm text-stone-400">No data.</p>;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {filled.map((item) => (
        <div key={item.label}>
          <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            {item.label}
          </div>
          <div className="mt-0.5 text-sm text-stone-800 break-words">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
