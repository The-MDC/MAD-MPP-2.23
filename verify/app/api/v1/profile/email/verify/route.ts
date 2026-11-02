import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { withRouteGuard } from "@/lib/with-route-guard";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { CODE_MAX_ATTEMPTS, hashEmailCode } from "@/lib/profile";

/** POST /api/v1/profile/email/verify — { code }. Five attempts per code, fifteen minutes; then the address is verified. */
export const POST = withRouteGuard({ mode: "session", bucket: "profile-email-verify", limit: 10, windowMs: 10 * 60_000 }, async (req, { owner }) => {
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "Profiles are offline for a moment." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.replace(/\D/g, "") : "";
  if (code.length !== 6) return NextResponse.json({ success: false, error: "Enter the six-digit code." }, { status: 400 });
  try {
    const pool = getDbPool();
    const r = await pool.query("UPDATE email_verifications SET attempts = attempts + 1 WHERE wallet_address = lower($1) AND expires_at > now() RETURNING email, code_hash, attempts", [owner]);
    const row = r.rows[0];
    if (!row) return NextResponse.json({ success: false, error: "That code has expired. Ask for a new one." }, { status: 410 });
    if (row.attempts > CODE_MAX_ATTEMPTS) return NextResponse.json({ success: false, error: "Too many tries. Ask for a new code." }, { status: 429 });
    const want = Buffer.from(String(row.code_hash));
    const got = Buffer.from(hashEmailCode(code, owner, String(row.email)));
    if (want.length !== got.length || !timingSafeEqual(want, got)) return NextResponse.json({ success: false, error: "That code isn't right." }, { status: 400 });
    await pool.query(
      `INSERT INTO user_profiles (wallet_address, email, email_verified_at) VALUES (lower($1), $2, now())
       ON CONFLICT (wallet_address) DO UPDATE SET email = $2, email_verified_at = now(), updated_at = now()`,
      [owner, row.email],
    );
    await pool.query("DELETE FROM email_verifications WHERE wallet_address = lower($1)", [owner]);
    return NextResponse.json({ success: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, error: "Could not verify right now." }, { status: 503 });
  }
});
