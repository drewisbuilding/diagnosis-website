"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

function RequestRewriteForm() {
  const searchParams = useSearchParams();
  const prefilledUrl = searchParams.get("url") ?? "";
  const analysisId = searchParams.get("analysisId") ?? null;

  const [website, setWebsite] = useState(prefilledUrl);
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fallback state: after repeated failures, capture email via /api/capture
  const [fallbackSubmitting, setFallbackSubmitting] = useState(false);
  const [fallbackDone, setFallbackDone] = useState(false);

  useEffect(() => {
    trackEvent("rewrite_request_viewed", { has_prefilled_url: !!prefilledUrl });
  }, [prefilledUrl]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!website || !email || !goal) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/rewrite-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: website,
          email,
          goal,
          notes: notes || undefined,
          analysisId,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg = (data as { error?: string }).error ?? "Something went wrong.";
        setError(errorMsg);
        setRetryCount((c) => c + 1);
        trackEvent("rewrite_request_save_failed", {
          attempt: retryCount + 1,
          status: res.status,
        });
        setSubmitting(false);
        return;
      }

      trackEvent("rewrite_request_submitted", { has_notes: !!notes });
      setConfirmed(true);
    } catch {
      setError("Could not connect. Please check your connection and try again.");
      setRetryCount((c) => c + 1);
      trackEvent("rewrite_request_save_failed", { attempt: retryCount + 1, status: "network" });
      setSubmitting(false);
    }
  }

  // Fallback: if the full save keeps failing, at minimum capture the email lead
  async function handleFallback(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!email) return;
    setFallbackSubmitting(true);
    try {
      // Best-effort — /api/capture uses a separate table that already works
      await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          url: website,
          wantsFullReport: true,
          analysisId,
        }),
      });
    } catch {
      // Intentionally silent — we still show success to avoid dead-ending the user
    }
    setFallbackDone(true);
    setFallbackSubmitting(false);
  }

  const inputClass =
    "w-full rounded border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500";

  if (confirmed) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <div className="rounded-lg border border-stone-200 bg-white px-6 py-8">
            <p className="text-base font-semibold text-stone-900">Got it — I&apos;ll take a look</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">
              I&apos;ve got your request and I&apos;ll review your page and follow up by email.
              If there&apos;s anything specific you want me to focus on, you can reply when my email arrives.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (fallbackDone) {
    return (
      <div className="min-h-screen bg-stone-50">
        <Header />
        <main className="mx-auto max-w-2xl px-6 py-12">
          <div className="rounded-lg border border-stone-200 bg-white px-6 py-8">
            <p className="text-base font-semibold text-stone-900">Got it — I&apos;ll reach out</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">
              I&apos;ll follow up shortly with next steps based on your analysis.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-2 text-xl font-semibold text-stone-900">
          Let&apos;s fix your homepage
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-stone-500">
          I&apos;ll rewrite the key parts of your page using the analysis you just saw.
          This usually includes a clearer headline and subheadline, better structure, stronger
          CTAs, and removal of confusing or unnecessary language.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Website */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yoursite.com"
              required
              className={inputClass}
            />
          </div>

          {/* Email — required, must not be skipped on this path */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          {/* Goal */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
              What&apos;s your main goal?
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="More signups, more sales, clearer messaging, better first impression…"
              required
              className={inputClass}
            />
          </div>

          {/* Notes — optional */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
              Anything else I should know?{" "}
              <span className="font-normal normal-case text-stone-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Audience, tone, things you want to keep, context about the product…"
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {/* Error state */}
          {error && (
            <div className="rounded border border-stone-200 bg-stone-50 px-4 py-3">
              <p className="text-xs text-stone-600">
                Something went wrong while saving your request. You can try again, or continue
                and I&apos;ll still use what you entered.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={!website || !email || !goal || submitting}
            className="w-full rounded bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Saving…" : "Continue"}
          </button>
        </form>

        {/* Fallback — shown after 2+ consecutive save failures */}
        {retryCount >= 2 && error && (
          <div className="mt-6 rounded-lg border border-stone-200 bg-white px-5 py-5">
            <p className="text-sm font-medium text-stone-800">Still not working?</p>
            <p className="mt-1 mb-4 text-xs leading-relaxed text-stone-500">
              Leave your email and I&apos;ll reach out directly to get your page sorted.
            </p>
            <form onSubmit={handleFallback} className="flex gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="min-w-0 flex-1 rounded border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500"
              />
              <button
                type="submit"
                disabled={!email || fallbackSubmitting}
                className="flex-shrink-0 rounded bg-stone-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-900 disabled:opacity-40"
              >
                {fallbackSubmitting ? "…" : "Send"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight text-stone-900">
          Diagnosis
        </Link>
      </div>
    </header>
  );
}

export default function RequestRewritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <RequestRewriteForm />
    </Suspense>
  );
}
