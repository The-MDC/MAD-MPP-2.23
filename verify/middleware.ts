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
const GUEST_USER = process.env.GUEST_USER ?? "Guest0001";
const GUEST_PASS = process.env.GUEST_PASS ?? "Guest1979";

export function middleware(req: NextRequest) {
  const header = req.headers.get("authorization");

  if (header?.startsWith("Basic ")) {
    // atob is available in the Edge runtime.
    const decoded = atob(header.slice(6));
    const sep = decoded.indexOf(":");
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    if (user === GUEST_USER && pass === GUEST_PASS) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Guest access required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="MAD Gambit — Guest Access", charset="UTF-8"',
    },
  });
}

export const config = {
  // Gate all pages. Exclude Next internals and /api so static assets load after
  // sign-in and server-to-server / cron calls to the API are not blocked.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
