import { NextRequest, NextResponse } from "next/server";
import { verifySiwe, EXPECTED_CHAIN_ID } from "@/lib/siwe-verify";
import { createSession, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";
import { enforceRateLimit } from "@/lib/rate-limit";
import { recordSuccessfulLogin } from "@/lib/customer-store";

// PUBLIC-ROUTE: The sign-in endpoint itself. It cannot require a session to establish one; its guard is SIWE signature verification plus a single-use nonce.
// Rate-limited, because open still needs a cost ceiling.
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, "auth-verify", 10, 60_000); // 10/min/IP
  if (limited) return limited;

  const { message, signature } = await req.json().catch(() => ({}));
  if (!message || !signature)
    return NextResponse.json({ error: "message and signature required" }, { status: 400 });

  const host = req.headers.get("host") ?? "";
  const result = await verifySiwe(message, signature, host);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 401 });

  const token = createSession(result.address!, EXPECTED_CHAIN_ID);
  if (!token) {
    // SESSION_SECRET not configured — fail closed. Never fall back to a
    // forgeable plaintext cookie; report that sessions are disabled instead.
    return NextResponse.json({
      ok: true,
      address: result.address,
      session: false,
      warning: "SESSION_SECRET not set — signed session cookie not issued",
    });
  }

  await recordSuccessfulLogin(result.address!, EXPECTED_CHAIN_ID, req).catch((error) => {
    console.error("customer login audit failed:", error);
  });

  const res = NextResponse.json({ ok: true, address: result.address, session: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  return res;
}
