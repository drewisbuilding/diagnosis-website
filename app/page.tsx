"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
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
    <div className="flex min-h-screen flex-col bg-white">
      <header className="px-6 py-5">
        <div className="mx-auto max-w-2xl">
          <span className="text-sm font-semibold tracking-tight text-stone-900">Diagnosis</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-24">
        <div className="w-full max-w-xl">
          <div className="mb-10">
            <h1 className="mb-4 text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl">
              Your page isn&apos;t underperforming.
              <br />
              It&apos;s unclear.
            </h1>
            <p className="text-base leading-relaxed text-stone-500">
              One clear diagnosis of what&apos;s actually blocking conversions — in under a minute.
            </p>
          </div>

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
              className="w-full rounded border border-stone-300 bg-stone-50 px-4 py-3.5 text-sm text-stone-900 placeholder-stone-400 focus:border-stone-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-500 disabled:opacity-50"
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

          <p className="mt-4 text-center text-xs text-stone-400">No signup required.</p>
        </div>
      </main>
    </div>
  );
}
