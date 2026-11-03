import { NextResponse } from "next/server";
import { resolveMx } from "node:dns/promises";
import { withRouteGuard } from "@/lib/with-route-guard";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { checkEmail, CODE_TTL_MS, hashEmailCode, newEmailCode } from "@/lib/profile";
import { sendMail } from "@/lib/mailer";

/**
 * POST /api/v1/profile/email — { email }. Starts verification: only a verifiable personal or real-domain address is
 * accepted (lib/profile.ts#checkEmail), and a six-digit code is emailed to it. Only the code's hash is stored.
 */
export const POST = withRouteGuard({ mode: "session", bucket: "profile-email", limit: 5, windowMs: 60 * 60_000 }, async (req, { owner }) => {
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "Profiles are offline for a moment." }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { email?: unknown } | null;
  const v = await checkEmail(body?.email, resolveMx);
  if (!v.ok || !v.email) return NextResponse.json({ success: false, error: v.reason }, { status: 400 });

  const code = newEmailCode();
  try {
    const pool = getDbPool();
    const taken = await pool.query("SELECT 1 FROM user_profiles WHERE lower(email) = $1 AND email_verified_at IS NOT NULL AND wallet_address <> lower($2)", [v.email, owner]);
    if (taken.rows[0]) return NextResponse.json({ success: false, error: "That email is already verified on another account." }, { status: 409 });
    await pool.query(
      `INSERT INTO email_verifications (wallet_address, email, code_hash, attempts, expires_at) VALUES (lower($1), $2, $3, 0, $4)
       ON CONFLICT (wallet_address) DO UPDATE SET email = EXCLUDED.email, code_hash = EXCLUDED.code_hash, attempts = 0, expires_at = EXCLUDED.expires_at, created_at = now()`,
      [owner, v.email, hashEmailCode(code, owner, v.email), new Date(Date.now() + CODE_TTL_MS).toISOString()],
    );
  } catch {
    return NextResponse.json({ success: false, error: "Could not start verification." }, { status: 503 });
  }
  const status = await sendMail({
    to: v.email,
    subject: "Your MAD Gambit verification code",
    text: `Your MAD Gambit verification code is ${code}. It expires in 15 minutes.\n\nIf you didn't ask for this, ignore this email. Nobody from MAD Gambit will ever ask you for this code, your password or your seed phrase.`,
  });
  if (status !== "sent") return NextResponse.json({ success: false, error: status === "not-configured" ? "Email verification isn't switched on yet. Try again soon." : "We couldn't send the code. Try again in a minute." }, { status: 503 });
  return NextResponse.json({ success: true, kind: v.kind }, { headers: { "cache-control": "no-store" } });
});
