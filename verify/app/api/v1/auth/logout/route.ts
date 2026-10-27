import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/v1/auth/logout — clear the session cookie.
 *
 * There was no way to sign out. The UI's sign-out button cleared two React
 * booleans and nothing else, so the signed httpOnly cookie survived: the user
 * saw a logged-out header while every API route still accepted them, and a
 * refresh (once auth reads the server, as it now does) put them straight back
 * in. On a shared machine that is someone else's session left open.
 *
 * Expiring the cookie is the whole job — sessions are stateless HMAC tokens
 * (lib/session.ts), so there is no server record to revoke. That does mean a
 * token already copied out of the browser stays valid until `exp`; shortening
 * SESSION_TTL_S is the lever for that, not this route.
 *
 * PUBLIC-ROUTE: signing out must work even when the session is already invalid
 * or expired, so this deliberately requires no auth. Rate-limited only.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, "auth-logout", 30, 60_000);
  if (limited) return limited;

  const res = NextResponse.json({ success: true, authenticated: false });
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return res;
}
