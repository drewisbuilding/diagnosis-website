"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { REWRITE_PRICE_DISPLAY } from "@/lib/config";
import { trackEvent } from "@/lib/analytics";

function OfferContent() {
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("offer_page_viewed", { has_request_id: !!requestId });
  }, [requestId]);

  async function handleGetFixed() {
    if (!requestId) {
      setError("Missing request ID. Please go back and resubmit.");
      return;
    }

    trackEvent("payment_cta_clicked");
    setSubmitting(true);
    setError(null);

    try {
      // TODO: When Stripe is ready, expect { checkoutUrl } here and redirect:
      //   const { checkoutUrl } = await res.json();
      //   window.location.href = checkoutUrl;
      const res = await fetch("/api/rewrite-request/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      trackEvent("payment_completed");
      setSubmitted(true);
    } catch {
      setError("Could not connect. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-stone-50">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-2xl items-center px-6 py-4">
            <Link href="/" className="text-sm font-semibold tracking-tight text-stone-900">
              Diagnosis
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-6 py-12">
          <div className="rounded-lg border border-stone-200 bg-white px-6 py-8">
            <p className="text-base font-semibold text-stone-900">Got it — I&apos;ll take a look</p>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">
              I&apos;ll review your page and follow up shortly. If there&apos;s anything specific
              you want me to focus on, reply when the email arrives.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-2xl items-center px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-stone-900">
            Diagnosis
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-stone-400">
          Here&apos;s how this works
        </div>
        <h1 className="mb-8 text-xl font-semibold text-stone-900">
          Homepage Rewrite — early user pricing
        </h1>

        <div className="rounded-lg border border-stone-200 bg-white px-6 py-6">
          <div className="mb-4 flex items-baseline gap-1">
            <span className="text-3xl font-light text-stone-900">{REWRITE_PRICE_DISPLAY}</span>
          </div>

          <p className="mb-5 text-sm leading-relaxed text-stone-500">
            I&apos;m keeping this simple while I work with a small number of sites and refine the
            process.
          </p>

          <ul className="mb-6 space-y-2.5">
            {[
              "Delivered in 24–48 hours",
              "Rewritten key homepage sections",
              "Based on your current page and analysis",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-stone-700">
                <span className="mt-0.5 flex-shrink-0 text-stone-400">—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

          <button
            type="button"
            onClick={handleGetFixed}
            disabled={submitting}
            className="w-full rounded bg-stone-900 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Processing…" : "Get my page fixed"}
          </button>

          {/* TODO: Replace note below with Stripe payment flow when ready */}
          <p className="mt-3 text-center text-xs text-stone-400">
            Payment details confirmed via email.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function OfferPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-stone-50" />}>
      <OfferContent />
    </Suspense>
  );
}
