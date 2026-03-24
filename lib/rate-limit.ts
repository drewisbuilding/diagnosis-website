// Simple in-memory IP-based rate limiter.
// Works for Vercel serverless (per-instance), not coordinated across instances.
// Good enough for V1 low-traffic protection.

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  // Temporarily disabled for debugging — always allow
  if (process.env.NODE_ENV !== "production") {
    return { allowed: true, remaining: maxRequests, resetAt: Date.now() + windowMs };
  }

  const now = Date.now();
  const key = ip;
  const record = store.get(key);

  if (!record || now >= record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}
