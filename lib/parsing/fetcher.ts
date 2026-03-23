// ─── Page Fetcher ─────────────────────────────────────────────────────────────
// Fetches a URL and returns the raw HTML response.
// Performs SSRF checks on the initial URL and every redirect destination.

import { assertSafeUrl } from "@/lib/security/ssrf-guard";

const FETCH_TIMEOUT_MS = 15000;
const MAX_HTML_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_REDIRECTS = 5;

const USER_AGENT =
  "Mozilla/5.0 (compatible; ConversionDiagnosis/1.0; +https://diagnosis.app)";

const REQUEST_HEADERS = {
  "User-Agent": USER_AGENT,
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  "Cache-Control": "no-cache",
  // Explicitly omit: Cookie, Authorization, X-Forwarded-*, etc.
};

export interface FetchResult {
  html: string;
  finalUrl: string;
  statusCode: number;
  contentType: string;
}

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "timeout"
      | "network"
      | "not_html"
      | "not_found"
      | "too_large"
      | "blocked"
      | "unknown"
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export async function fetchPage(url: string): Promise<FetchResult> {
  // SSRF guard on initial URL
  try {
    await assertSafeUrl(url);
  } catch (err) {
    throw new FetchError(
      err instanceof Error ? err.message : "URL is not allowed",
      "blocked"
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let currentUrl = url;
  let response: Response | undefined;

  try {
    // Manual redirect following — check each hop with the SSRF guard
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const r = await fetch(currentUrl, {
        headers: REQUEST_HEADERS,
        signal: controller.signal,
        redirect: "manual",
      });

      if (r.status >= 300 && r.status < 400) {
        const location = r.headers.get("location");
        if (!location) {
          throw new FetchError("Redirect with no Location header", "network");
        }

        const nextUrl = new URL(location, currentUrl).toString();

        // SSRF guard on redirect destination
        try {
          await assertSafeUrl(nextUrl);
        } catch (err) {
          throw new FetchError(
            err instanceof Error ? err.message : "Redirect target is not allowed",
            "blocked"
          );
        }

        currentUrl = nextUrl;

        if (hop === MAX_REDIRECTS) {
          throw new FetchError("Too many redirects", "network");
        }
        continue;
      }

      response = r;
      break;
    }
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof FetchError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new FetchError(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s`, "timeout");
    }
    throw new FetchError(
      err instanceof Error ? `Network error: ${err.message}` : "Network error",
      "network"
    );
  }

  clearTimeout(timeout);

  if (!response) {
    throw new FetchError("No response received", "unknown");
  }

  if (response.status === 404) {
    throw new FetchError("Page not found (404)", "not_found");
  }

  if (response.status === 403 || response.status === 401) {
    throw new FetchError(
      `Page blocked access (${response.status})`,
      "blocked"
    );
  }

  if (!response.ok) {
    throw new FetchError(`Page returned error status ${response.status}`, "unknown");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
    throw new FetchError(`Page is not HTML (content-type: ${contentType})`, "not_html");
  }

  // Stream with size limit
  const reader = response.body?.getReader();
  if (!reader) {
    throw new FetchError("Could not read response body", "unknown");
  }

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > MAX_HTML_BYTES) {
      reader.cancel();
      break;
    }
    chunks.push(value);
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return {
    html: new TextDecoder().decode(combined),
    finalUrl: currentUrl,
    statusCode: response.status,
    contentType,
  };
}
