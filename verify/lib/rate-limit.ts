/**
 * Lightweight fixed-window rate limiter.
 *
 * In-memory and therefore per-instance — best-effort on serverless (each Vercel
 * instance keeps its own counters). It meaningfully throttles abuse from a
 * single warm instance and is a safe first layer; for hard multi-instance
 * guarantees, back the counter with Vercel KV / Upstash or a Postgres upsert.
 * (Replay protection does NOT rely on this — that's the single-use nonce.)
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const rec = windows.get(key);
  if (!rec || now > rec.resetAt) {
    const resetAt = now + windowMs;
    windows.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }
  if (rec.count >= limit) {
    return { ok: false, remaining: 0, resetAt: rec.resetAt };
  }
  rec.count += 1;
  return { ok: true, remaining: limit - rec.count, resetAt: rec.resetAt };
}

/** Best-effort client IP from proxy headers (Vercel sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** 429 helper: apply a limit and return a Response when exceeded, else null. */
export function enforceRateLimit(
  req: Request,
  bucket: string,
  limit: number,
  windowMs: number,
): Response | null {
  const { ok, resetAt } = rateLimit(`${bucket}:${clientIp(req)}`, limit, windowMs);
  if (ok) return null;
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return new Response(JSON.stringify({ success: false, error: 'rate limited' }), {
    status: 429,
    headers: { 'content-type': 'application/json', 'retry-after': String(retryAfter) },
  });
}
