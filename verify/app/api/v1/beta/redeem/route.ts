import { NextResponse } from "next/server";
import { BETA_COOKIE, BETA_TTL_SECONDS, signPass } from "@/lib/beta-gate";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { hashCode, inviteUser, normaliseCode } from "@/lib/support/beta";
import { FAKE_SUCCESS, guardPublicForm } from "@/lib/support/form-guard";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/beta/redeem — redeem an invite code for a beta pass. { code, challenge }.
 * PUBLIC-ROUTE: redeeming a code is how an invitee gets their first pass. Codes are stored hashed, single- or
 * limited-use, and expire; guessing is bounded by the signup shield and 5 attempts per IP per 10 minutes against a
 * code space of about a trillion.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "beta-redeem", 5, 10 * 60_000);
  if (limited) return limited;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const g = await guardPublicForm(req, body);
  if (g.kind === "deny") return g.response;
  if (g.kind === "honeypot") return FAKE_SUCCESS();
  if (process.env.BETA_INVITES_DISABLED === "1") return NextResponse.json({ success: false, error: "Invites are paused right now." }, { status: 409 });

  const code = normaliseCode(body?.code);
  if (!code) return NextResponse.json({ success: false, error: "That code doesn't look right. It's in the form MAD-XXXX-XXXX." }, { status: 400 });
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "Invites are paused for a moment." }, { status: 503 });
  try {
    const r = await getDbPool().query(
      `UPDATE beta_invites SET uses_left = uses_left - 1 WHERE code_hash = $1 AND uses_left > 0 AND expires_at > now() RETURNING id`,
      [hashCode(code)],
    );
    if (!r.rows[0]) return NextResponse.json({ success: false, error: "That code is invalid, used up or expired." }, { status: 404 });
    const res = NextResponse.json({ success: true, next: "/" });
    res.cookies.set(BETA_COOKIE, await signPass(inviteUser("invite", r.rows[0].id)), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: BETA_TTL_SECONDS });
    return res;
  } catch {
    return NextResponse.json({ success: false, error: "Invites are paused for a moment." }, { status: 503 });
  }
}
