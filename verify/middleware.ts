import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Guest access gate (HTTP Basic Auth) for the MPP.
 *
 * Presents a browser username/password prompt so mpp.madgambit.io is only
 * reachable with the shared guest credentials. Values come from env when set
 * (override in Vercel → Settings → Environment Variables) and fall back to the
 * intentionally-shareable guest login otherwise.
 *
 * NOTE: this is an application-level gate. It only takes effect once Vercel
 * Deployment Protection is turned OFF for this project — otherwise Vercel's own
 * SSO gate blocks the request before middleware runs.
 */
// Shared guest logins (intentionally shareable). Multiple pairs are accepted;
// the primary pair can also be overridden/added via env (GUEST_USER/GUEST_PASS).
const GUESTS: Record<string, string> = {
  Guest0001: "Guest1979",
  Guest0002: "Guest1980",
};
if (process.env.GUEST_USER && process.env.GUEST_PASS) {
  GUESTS[process.env.GUEST_USER] = process.env.GUEST_PASS;
}

export function middleware(req: NextRequest) {
  const header = req.headers.get("authorization");

  if (header?.startsWith("Basic ")) {
    // atob is available in the Edge runtime.
    const decoded = atob(header.slice(6));
    const sep = decoded.indexOf(":");
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    // Object.hasOwn guards against prototype keys (e.g. "constructor").
    if (Object.hasOwn(GUESTS, user) && GUESTS[user] === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Guest access required.", {
    status: 401,
    headers: {
      // Realm must be Latin-1 only — a non-ASCII char (e.g. an em-dash) makes the
      // Edge runtime drop the whole header, so the browser never shows the login
      // dialog and users just see the 401 body. Keep it plain ASCII.
      "WWW-Authenticate": 'Basic realm="MAD Gambit Guest Access", charset="UTF-8"',
    },
  });
}

export const config = {
  // Gate all pages. Exclude Next internals and /api so static assets load after
  // sign-in and server-to-server / cron calls to the API are not blocked.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
