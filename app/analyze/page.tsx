"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AnalyzePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!url) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }

      router.push(`/report/${data.submission_id}`);
    } catch {
      setError("Could not connect. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-2xl px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-stone-900">
            Diagnosis
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight text-stone-900">
          Diagnose your page
        </h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://yourpage.com"
            required
            disabled={submitting}
            autoFocus
            className="w-full rounded border border-stone-300 bg-white px-4 py-3.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-1 focus:ring-stone-500 disabled:opacity-50"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={!url || submitting}
            className="w-full rounded bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? "Starting…" : "Diagnose your page"}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-stone-400">No signup required</p>
      </main>
    </div>
  );
}
