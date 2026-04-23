/**
 * Simpele in-memory rate limiter. Werkt per lambda-instantie (dus niet
 * globaal consistent op Vercel), maar is genoeg voor eerste productie-gebruik
 * en voorkomt dat één client binnen één worker je Anthropic-rekening opblaast.
 *
 * Voor multi-region consistentie: vervang later door @upstash/ratelimit.
 */

type Bucket = { resetAt: number; count: number };
const buckets = new Map<string, Bucket>();

// Houd de map schoon — kleine GC elke paar minuten
let lastGc = Date.now();
function gc(now: number) {
  if (now - lastGc < 60_000) return;
  lastGc = now;
  for (const [key, b] of buckets) {
    if (b.resetAt < now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetInMs: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  gc(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { resetAt: now + windowMs, count: 1 });
    return { ok: true, remaining: limit - 1, resetInMs: windowMs };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, resetInMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return {
    ok: true,
    remaining: limit - bucket.count,
    resetInMs: bucket.resetAt - now,
  };
}

/**
 * Probeer een unieke client-identificatie te maken uit een Next request.
 * Voor Vercel: x-forwarded-for bevat het echte IP als eerste entry.
 */
export function clientIdFromRequest(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/**
 * Standaard JSON-response voor 429.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Even rustig — te veel verzoeken in korte tijd. Probeer het over een paar minuten opnieuw.",
      retryAfterSec: Math.ceil(result.resetInMs / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil(result.resetInMs / 1000).toString(),
      },
    }
  );
}
