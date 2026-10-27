import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";
import { BETA_COOKIE, BETA_TTL_SECONDS, guestValid, loadGuests, safeNext, signPass } from "@/lib/beta-gate";

export const dynamic = "force-dynamic";

// PUBLIC-ROUTE: this IS the sign-in — it cannot require the pass it issues.
// It checks the same GUEST_LOGINS credentials the Basic gate always checked,
// is rate-limited (10 tries / 10 min per IP) against guessing, and issues only
// an HMAC-signed, HttpOnly, week-long cookie that proxy.ts verifies per request.
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "beta-signin", 10, 10 * 60_000);
  if (limited) return limited;

  let user = "";
  let pass = "";
  let next: string | null = null;
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const body = (await req.json()) as { user?: unknown; pass?: unknown; next?: unknown };
      user = typeof body.user === "string" ? body.user.trim() : "";
      pass = typeof body.pass === "string" ? body.pass : "";
      next = typeof body.next === "string" ? body.next : null;
    } else {
      const form = await req.formData();
      user = String(form.get("user") ?? "").trim();
      pass = String(form.get("pass") ?? "");
      next = form.get("next") ? String(form.get("next")) : null;
    }
  } catch {
    return NextResponse.json({ success: false, error: "Send a username and password." }, { status: 400 });
  }

  const guests = loadGuests();
  if (!user || !pass || !guestValid(guests, user, pass)) {
    return NextResponse.json({ success: false, error: "That username and password don't match a creator pass." }, { status: 401 });
  }

  const res = NextResponse.json({ success: true, next: safeNext(next) });
  res.cookies.set(BETA_COOKIE, await signPass(user), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: BETA_TTL_SECONDS,
  });
  return res;
}
