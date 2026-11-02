import { NextResponse } from "next/server";
import { BETA_COOKIE, BETA_TTL_SECONDS, signPass } from "@/lib/beta-gate";
import { getDbPool } from "@/lib/db";
import { hasDatabaseUrl } from "@/lib/database-url";
import { betaCapacity, betaPhase, inviteUser } from "@/lib/support/beta";
import { canonicalEmail, isDisposableEmail } from "@/lib/signup-shield";
import { FAKE_SUCCESS, guardPublicForm } from "@/lib/support/form-guard";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

/**
 * POST /api/v1/beta/join — self-admission to the EXTENDED OPEN BETA. { email, challenge }.
 * PUBLIC-ROUTE: this is how someone without a pass gets one; it is only live while BETA_PHASE=open, is capped by
 * BETA_CAPACITY, and sits behind the signup shield (proof of work, time trap, honeypot, disposable-mail refusal).
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "beta-join", 3, 60 * 60_000);
  if (limited) return limited;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const g = await guardPublicForm(req, body);
  if (g.kind === "deny") return g.response;
  if (g.kind === "honeypot") return FAKE_SUCCESS();
  if (betaPhase() !== "open") return NextResponse.json({ success: false, error: "The open beta isn't open yet. Join the waitlist instead." }, { status: 409 });

  const raw = typeof body?.email === "string" ? body.email.trim().slice(0, 254) : "";
  if (!EMAIL.test(raw)) return NextResponse.json({ success: false, error: "That email doesn't look right." }, { status: 400 });
  if (isDisposableEmail(raw)) return NextResponse.json({ success: false, error: "Please use a permanent email address." }, { status: 400 });
  if (!hasDatabaseUrl()) return NextResponse.json({ success: false, error: "Admissions are paused for a moment." }, { status: 503 });

  const email = canonicalEmail(raw);
  try {
    const pool = getDbPool();
    const admitted = await pool.query("SELECT count(*)::int AS n FROM beta_signups WHERE admitted_at IS NOT NULL");
    if ((admitted.rows[0]?.n ?? 0) >= betaCapacity()) return NextResponse.json({ success: false, error: "The open beta is full right now. You're welcome on the waitlist." }, { status: 409 });
    const r = await pool.query(
      `INSERT INTO beta_signups (email, role, source, admitted_at, cohort) VALUES ($1, 'trader', 'open-beta', now(), 'open')
       ON CONFLICT ((lower(email))) DO UPDATE SET admitted_at = coalesce(beta_signups.admitted_at, now()) RETURNING id`,
      [email],
    );
    const res = NextResponse.json({ success: true, next: "/" });
    res.cookies.set(BETA_COOKIE, await signPass(inviteUser("open", r.rows[0].id)), { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: BETA_TTL_SECONDS });
    return res;
  } catch {
    return NextResponse.json({ success: false, error: "Admissions are paused for a moment." }, { status: 503 });
  }
}
