"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type {
  Report,
  DiagnosisIssue,
} from "@/lib/types";
import { trackEvent } from "@/lib/analytics";

// ─── Polling ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3000;

// ─── Loading Experience ───────────────────────────────────────────────────────

const LOADING_MESSAGES = [
  "Diagnosing clarity…",
  "Checking what a visitor sees first…",
  "Finding the main blocker…",
];

// Deliberately varied so rotation feels like progress, not a ticker
const LOADING_DURATIONS = [2500, 3000, 3200];

interface SubmissionContext {
  url: string;
  desired_action: string | null;
  page_type: string | null;
  created_at: string;
  analysis_id: string | null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const params = useParams();
  const id = params?.id as string;

  const [report, setReport] = useState<Report | null>(null);
  const [submission, setSubmission] = useState<SubmissionContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const [revealed, setRevealed] = useState(false);

  const poll = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/report/${id}`);
      if (!res.ok) { setError("Could not load this report."); setPolling(false); return; }
      const data = await res.json();
      if (data.submission) setSubmission(data.submission);
      if (data.status === "complete" && data.report) {
        setReport(data.report); setPolling(false);
      } else if (data.status === "failed") {
        setError(data.error ?? "The analysis failed. Please try again."); setPolling(false);
      }
    } catch {
      setError("Connection error. Please refresh."); setPolling(false);
    }
  }, [id]);

  useEffect(() => { poll(); }, [poll]);
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [polling, poll]);

  // Brief reveal moment before rendering full report
  useEffect(() => {
    if (!report) return;
    const timeout = setTimeout(() => setRevealed(true), 1800);
    return () => clearTimeout(timeout);
  }, [report]);

  // Track diagnosis view once report is revealed
  useEffect(() => {
    if (report && revealed) {
      trackEvent("diagnosis_viewed", { tier: report.tier, score: report.overall_score });
    }
  }, [report, revealed]);

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-stone-900">
            Diagnosis
          </Link>
          <Link href="/analyze" className="text-sm text-stone-400 hover:text-stone-900 transition-colors">
            Analyze another page →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        {!report && !error && <LoadingState submission={submission} />}
        {error && <ErrorState message={error} />}
        {report && !revealed && <RevealState />}
        {report && revealed && submission && <ReportView report={report} submission={submission} />}
      </main>
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────

function LoadingState({ submission }: { submission: SubmissionContext | null }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    function advance(currentIndex: number) {
      const t1 = setTimeout(() => {
        setVisible(false);
        const t2 = setTimeout(() => {
          const next = (currentIndex + 1) % LOADING_MESSAGES.length;
          setMsgIndex(next);
          setVisible(true);
          advance(next);
        }, 400);
        timers.push(t2);
      }, LOADING_DURATIONS[currentIndex]);
      timers.push(t1);
    }

    advance(0);
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <Spinner />
      <div className="mt-6" style={{ opacity: visible ? 1 : 0, transition: "opacity 0.4s ease" }}>
        <p className="text-sm font-semibold text-stone-900">{LOADING_MESSAGES[msgIndex]}</p>
      </div>
      <p className="mt-2 text-xs text-stone-400">
        Looking at your page the way a first-time visitor would.
      </p>

      {/* Progress dots */}
      <div className="mt-8 flex gap-1.5">
        {LOADING_MESSAGES.map((_: string, i: number) => (
          <span
            key={i}
            className="block h-1 w-5 rounded-full transition-colors duration-500"
            style={{ backgroundColor: i === msgIndex ? "#292524" : "#e7e5e4" }}
          />
        ))}
      </div>

      {submission?.url && (
        <p className="mt-8 max-w-xs truncate text-[10px] text-stone-300" title={submission.url}>
          {submission.url}
        </p>
      )}
    </div>
  );
}

function RevealState() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="text-sm font-semibold text-stone-900">This page has one dominant issue.</p>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-6 w-6 animate-spin text-stone-300" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Error ────────────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <p className="mb-2 text-sm font-medium text-stone-800">Analysis could not be completed</p>
      <p className="mb-8 max-w-sm text-xs leading-relaxed text-stone-500">{message}</p>
      <Link href="/analyze" className="rounded bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700 transition-colors">
        Try again
      </Link>
    </div>
  );
}

// ─── Report View — master layout ──────────────────────────────────────────────

function ReportView({ report, submission }: { report: Report; submission: SubmissionContext }) {
  const primaryBlocker = report.tier1_blockers[0] ?? null;

  return (
    <div className="space-y-5">

      {/* ── 1. Header ── */}
      <ReportHeader report={report} submission={submission} />

      {/* ── 2. Diagnosis Title ── */}
      {report.title && (
        <h2 className="px-1 text-lg font-semibold leading-snug text-stone-900">{report.title}</h2>
      )}

      {/* ── 3. Summary ── */}
      <Section>
        <SectionLabel>Summary</SectionLabel>
        <p className="text-sm leading-relaxed text-stone-800">{report.executive_summary}</p>
      </Section>

      {/* ── 4. Core Problem ── */}
      {report.core_problem && <CoreProblem text={report.core_problem} />}

      {/* ── 5. Intent vs. Reality ── */}
      {report.intent_vs_reality && <IntentVsReality data={report.intent_vs_reality} />}

      {/* ── 6. Why a visitor hesitates ── */}
      {report.visitor_journey?.length > 0 && <VisitorJourney steps={report.visitor_journey} />}

      {/* ── 7. Primary Blocker ── */}
      {primaryBlocker && <PrimaryBlocker issue={primaryBlocker} />}

      {/* ── 8. What to change ── */}
      {primaryBlocker?.recommended_change && (
        <WhatToChange direction={primaryBlocker.recommended_change} />
      )}

      {/* ── 9. CTA Transition ── */}
      {report.cta_transition && (
        <CtaTransition text={report.cta_transition} />
      )}

      {/* ── 10. Action Block ── */}
      <ActionBlock url={submission.url} analysisId={submission.analysis_id} />

    </div>
  );
}

// ─── Report Header ────────────────────────────────────────────────────────────

function ReportHeader({ report, submission }: { report: Report; submission: SubmissionContext }) {
  const tierConfig = {
    critical:     { label: "Limited",    color: "text-red-500" },
    "needs-work": { label: "Developing", color: "text-amber-500" },
    solid:        { label: "Solid",      color: "text-blue-500" },
    optimized:    { label: "Strong",     color: "text-green-500" },
  }[report.tier];

  const date = new Date(submission.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="rounded-lg border border-stone-200 bg-white px-6 py-5">
      <div className="flex items-start gap-6">
        {/* URL + meta */}
        <div className="flex-1 min-w-0">
          <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Analyzed
          </div>
          <a
            href={submission.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-stone-900 underline decoration-stone-300 hover:decoration-stone-500 break-all"
          >
            {submission.url}
          </a>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stone-400">
            {submission.page_type && <span>Type: {submission.page_type}</span>}
            {submission.desired_action && <span>Goal: {submission.desired_action}</span>}
            <span>{date}</span>
          </div>
        </div>

        {/* Score — secondary, intentionally small */}
        <div className="flex-shrink-0 text-right">
          <div className={`text-2xl font-light ${tierConfig.color}`}>
            {report.overall_score}
          </div>
          <div className={`text-[10px] font-semibold uppercase tracking-wide ${tierConfig.color}`}>
            {tierConfig.label}
          </div>
          <div className="mt-0.5 text-[10px] text-stone-400">
            First-visit clarity
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Core Problem ─────────────────────────────────────────────────────────────

function CoreProblem({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-stone-300 bg-white px-6 py-5">
      <SectionLabel>Core Problem</SectionLabel>
      <p className="text-base font-medium leading-relaxed text-stone-900">{text}</p>
    </div>
  );
}

// ─── Intent vs. Reality ───────────────────────────────────────────────────────

function IntentVsReality({ data }: { data: { intent: string; reality: string } }) {
  return (
    <Section>
      <SectionLabel>Intent vs. Reality</SectionLabel>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            What the page intends to say
          </div>
          <p className="text-sm leading-relaxed text-stone-700">{data.intent}</p>
        </div>
        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-400">
            What a visitor actually gets
          </div>
          <p className="text-sm leading-relaxed text-stone-700">{data.reality}</p>
        </div>
      </div>
    </Section>
  );
}

// ─── Visitor Journey ──────────────────────────────────────────────────────────

function VisitorJourney({ steps }: { steps: string[] }) {
  return (
    <Section>
      <SectionLabel>Why a visitor hesitates</SectionLabel>
      <ol className="space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 text-[10px] font-semibold text-stone-400 tabular-nums w-4">
              {i + 1}
            </span>
            <span className="text-sm leading-relaxed text-stone-700">{step}</span>
          </li>
        ))}
      </ol>
    </Section>
  );
}

// ─── Primary Blocker — dominant card, expanded by default ────────────────────

function PrimaryBlocker({ issue }: { issue: DiagnosisIssue }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-700">
          Primary Blocker
        </span>
        <span className="text-[10px] text-stone-400">— the dominant conversion issue</span>
      </div>

      <div className="rounded-lg border-2 border-red-200 bg-white">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-5 text-left"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-base font-semibold leading-snug text-stone-900">
                {issue.title}
              </div>
              {!expanded && (
                <p className="mt-2 text-sm leading-relaxed text-stone-500 line-clamp-2">
                  {issue.observation}
                </p>
              )}
            </div>
            <span className="flex-shrink-0 text-stone-300 mt-1">{expanded ? "−" : "+"}</span>
          </div>
        </button>

        {expanded && (
          <div className="border-t border-red-100 px-5 py-5 space-y-5">
            <p className="text-sm leading-relaxed text-stone-700">
              {issue.prose || issue.observation}
            </p>
            {issue.evidence && (
              <blockquote className="rounded border-l-2 border-stone-300 bg-stone-50 pl-3 py-2 text-sm italic text-stone-600 leading-relaxed">
                &ldquo;{issue.evidence}&rdquo;
              </blockquote>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── What to Change ───────────────────────────────────────────────────────────

function WhatToChange({ direction }: { direction: string }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 px-5 py-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
        What to change
      </div>
      <p className="text-sm leading-relaxed text-stone-700">{direction}</p>
    </div>
  );
}

// ─── CTA Transition ───────────────────────────────────────────────────────────

function CtaTransition({ text }: { text: string }) {
  return (
    <p className="px-1 text-sm leading-relaxed text-stone-500">{text}</p>
  );
}

// ─── Action Block ─────────────────────────────────────────────────────────────

function ActionBlock({ url, analysisId }: { url: string; analysisId: string | null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function openModal() {
    setIsOpen(true);
    trackEvent("rewrite_cta_clicked", { variant: "primary" });
  }

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, url, wantsFullReport: false, analysisId }),
      });
      if (!res.ok) {
        setSubmitError("Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      trackEvent("email_capture_submitted", {});
      setSubmitted(true);
      setIsOpen(false);
    } catch {
      setSubmitError("Could not connect. Please try again.");
      setSubmitting(false);
    }
  }

  const requestRewriteHref = `/request-rewrite?url=${encodeURIComponent(url)}${analysisId ? `&analysisId=${analysisId}` : ""}`;

  return (
    <>
      {/* ── Action section ── */}
      <div className="mt-4 rounded-lg border-2 border-stone-900 bg-white px-6 py-8">
        <p className="text-base font-semibold text-stone-900">What should you do next?</p>
        <p className="mt-1 mb-6 text-sm leading-relaxed text-stone-500">
          I&apos;ll send you a clear plan to fix your page — including a rewrite and key improvements.
        </p>

        <button
          type="button"
          onClick={openModal}
          className="w-full rounded bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700"
        >
          Get the Fix Plan
        </button>

        {/* Soft secondary — visually de-emphasized, optional service path */}
        <div className="mt-5 border-t border-stone-100 pt-5 text-center">
          <p className="text-xs text-stone-400">
            Prefer not to deal with rewriting this yourself?
          </p>
          <p className="text-xs text-stone-400">
            I can fully rewrite your homepage based on this analysis — structure, messaging, and flow included.
          </p>
          <p className="mt-0.5 text-xs text-stone-400">
            (Most people review the plan first — but if you already know you want help, you can skip ahead.)
          </p>
          <Link
            href={requestRewriteHref}
            onClick={() => trackEvent("rewrite_cta_clicked", { variant: "tertiary" })}
            className="mt-2 inline-block text-xs font-medium text-stone-500 underline decoration-stone-300 transition-colors hover:text-stone-800 hover:decoration-stone-500"
          >
            → Request a rewrite
          </Link>
        </div>
      </div>

      {/* ── Confirmation (shown after email capture) ── */}
      {submitted && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 px-6 py-5 text-center">
          <p className="text-sm font-semibold text-stone-900">Check your inbox</p>
          <p className="mt-1 text-xs text-stone-500">I&apos;ll send your Fix Plan shortly.</p>
          <p className="mt-1 text-xs text-stone-400">Usually within a few minutes.</p>
        </div>
      )}

      {/* ── Fix Plan modal ── */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-stone-900">
                  Get your Fix Plan
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-stone-500">
                  I&apos;ll send you a clear, actionable plan to improve your page — including:
                </p>
                <ul className="mt-2 space-y-0.5 text-sm text-stone-500">
                  <li>• A rewritten headline, subheadline, and CTA</li>
                  <li>• The core issue holding your page back</li>
                  <li>• What to change and why it matters</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-shrink-0 text-stone-300 transition-colors hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                className="w-full rounded border border-stone-300 bg-stone-50 px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-500"
              />

              {submitError && <p className="text-xs text-red-600">{submitError}</p>}

              <button
                type="submit"
                disabled={!email || submitting}
                className="w-full rounded bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "Sending…" : "Send me the Fix Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-6 py-5">
      {children}
    </div>
  );
}

function SectionLabel({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <div className={`text-[10px] font-semibold uppercase tracking-wider text-stone-400 ${noMargin ? "" : "mb-3"}`}>
      {children}
    </div>
  );
}

