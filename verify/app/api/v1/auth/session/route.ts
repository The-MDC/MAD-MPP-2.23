import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * GET /api/v1/auth/session — "am I signed in, and as whom?"
 *
 * There was no way to ask. The only way to discover you had a session was to
 * call a route that needs one and read the 401 — so every client that wanted to
 * render a signed-in state either probed a money endpoint or, as the UI
 * actually did, kept its own boolean in React state and believed it.
 *
 * Reads the signed httpOnly cookie and reports what is in it. No database, no
 * secrets in the response, and never a 401: "not signed in" is a legitimate
 * answer to this question, not an error.
 */
export async function GET(req: Request) {
  const limited = enforceRateLimit(req, "auth-session", 120, 60_000);
  if (limited) return limited;

  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: true, authenticated: false, address: null, chainId: null });
  }

  return NextResponse.json({
    success: true,
    authenticated: true,
    address: session.address,
    chainId: session.chainId,
  });
}
