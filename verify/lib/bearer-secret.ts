import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";

/**
 * Shared-secret route credentials.
 *
 * Every check here is TIMING-SAFE. The previous `requireBearerSecret` compared
 * with `!==`, which short-circuits on the first differing byte and leaks the
 * secret's prefix to anyone willing to measure. `registrar/pause` already had a
 * timing-safe implementation inline; this is that one, made shared, so a new
 * privileged route cannot pick the weaker of two patterns sitting side by side.
 */

/** Env vars that name a privileged shared secret. */
export type SecretName = "CRON_SECRET" | "PAUSE_GUARDIAN_TOKEN" | "REGISTRAR_TOKEN";

/** Constant-time string compare that is also length-safe. */
export function secretMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  // timingSafeEqual throws on length mismatch, so the length check must come
  // first — it leaks only the length, which the header format reveals anyway.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** `Authorization: Bearer <secret>`. Used by the cron routes. */
export function requireBearerSecret(req: Request, envName: SecretName): Response | null {
  const expected = process.env[envName];
  if (!expected) {
    return NextResponse.json({ success: false, error: `${envName} not configured` }, { status: 503 });
  }
  const provided = req.headers.get("authorization") ?? "";
  if (!secretMatches(provided, `Bearer ${expected}`)) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * A named header carrying a role credential — `x-pause-guardian`, `x-registrar`.
 *
 * FAILS CLOSED WHEN UNCONFIGURED, and never degrades to session auth. A
 * privileged control that falls back to a weaker check under misconfiguration
 * is a control anyone can eventually reach: the attacker's move is to make the
 * env var disappear, not to guess the secret.
 */
export function requireHeaderSecret(
  req: Request,
  headerName: string,
  envName: SecretName,
): Response | null {
  const expected = process.env[envName];
  if (!expected) {
    return NextResponse.json(
      { success: false, error: `${envName} not configured — this action is unavailable` },
      { status: 503 },
    );
  }
  const provided = req.headers.get(headerName) ?? "";
  if (!secretMatches(provided, expected)) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }
  return null;
}
