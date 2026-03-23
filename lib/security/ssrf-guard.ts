// ─── SSRF Guard ───────────────────────────────────────────────────────────────
// Validates a URL is safe to fetch before sending any request.
// Blocks private IPs, loopback, link-local, metadata endpoints, and bad ports.

import { promises as dns } from "dns";

const MAX_URL_LENGTH = 2000;

// Hostnames that must never be fetched regardless of DNS result
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "169.254.169.254",   // AWS/Azure/GCP metadata
  "100.100.100.200",   // Alibaba Cloud metadata
]);

// Only allow standard web ports (empty port = default = always allowed)
const ALLOWED_EXPLICIT_PORTS = new Set([80, 443, 8080, 8443]);

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) return false;
  const [a, b] = parts;
  return (
    a === 127 ||                                   // loopback 127.0.0.0/8
    a === 10 ||                                    // private 10.0.0.0/8
    a === 0 ||                                     // reserved 0.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) ||           // private 172.16.0.0/12
    (a === 192 && b === 168) ||                    // private 192.168.0.0/16
    (a === 169 && b === 254) ||                    // link-local / metadata 169.254.0.0/16
    (a === 100 && b >= 64 && b <= 127) ||          // CGNAT 100.64.0.0/10
    a >= 224                                       // multicast + reserved
  );
}

function isPrivateIPv6(ip: string): boolean {
  const lc = ip.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    lc === "::1" ||
    lc.startsWith("fc") ||   // unique local fc00::/7
    lc.startsWith("fd") ||
    lc.startsWith("fe80") || // link-local
    lc.startsWith("ff")      // multicast
  );
}

function isPrivateIP(ip: string): boolean {
  return ip.includes(":") ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

// Throws a safe user-facing error if the URL is unsafe to fetch.
// Must be called before every fetch — including after redirects.
export async function assertSafeUrl(rawUrl: string): Promise<void> {
  if (rawUrl.length > MAX_URL_LENGTH) {
    throw new Error("URL is too long.");
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");

  // Explicit port check
  if (parsed.port) {
    const port = parseInt(parsed.port, 10);
    if (!ALLOWED_EXPLICIT_PORTS.has(port)) {
      throw new Error("Non-standard port not allowed.");
    }
  }

  // Hostname blocklist
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    throw new Error("This URL cannot be analyzed.");
  }

  // Direct IP access — check without DNS
  const isDirectIPv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
  const isDirectIPv6 = hostname.includes(":");
  if (isDirectIPv4 || isDirectIPv6) {
    if (isPrivateIP(hostname)) {
      throw new Error("This URL cannot be analyzed.");
    }
    return;
  }

  // DNS resolution — check all resolved addresses
  try {
    const records = await dns.lookup(hostname, { all: true });
    for (const { address } of records) {
      if (isPrivateIP(address)) {
        throw new Error("This URL cannot be analyzed.");
      }
    }
  } catch (err) {
    if (err instanceof Error && err.message === "This URL cannot be analyzed.") {
      throw err;
    }
    // DNS failure — fail safe (block)
    throw new Error("Could not verify this URL. Please check the address and try again.");
  }
}
