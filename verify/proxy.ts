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
 * SSO gate blocks the request before proxy runs.
 */
// Shared guest logins (intentionally shareable). Multiple pairs are accepted;
// the primary pair can also be overridden/added via env (GUEST_USER/GUEST_PASS).
const GUESTS: Record<string, string> = {
  Guest0001: "Guest1979",
  Guest0002: "Guest1980",
  Guest0003: "Guest1981",
  Guest0004: "Guest1982",
};
if (process.env.GUEST_USER && process.env.GUEST_PASS) {
  GUESTS[process.env.GUEST_USER] = process.env.GUEST_PASS;
}

const PUBLIC_PATHS = new Set([
  "/api/health",
  "/api/v1/health/db",
  "/health",
  "/favicon.ico",
  "/favicon.png",
  "/robots.txt",
  "/sitemap.xml",
]);

// Cron routes verify their own `Authorization: Bearer` secret (lib/bearer-secret.ts),
// and Vercel Cron sends exactly that header — not Basic auth. Without this
// pass-through the guest gate would 401 every scheduled invocation before the
// route's own check runs. Only these paths skip the gate, and only when a Bearer
// header is present; the route still rejects wrong/missing secrets itself.
const BEARER_PATHS = new Set([
  "/api/v1/cron/rollup",
  "/api/v1/perps/roll",
  "/api/v1/registrar/lapse",
  "/api/v1/ingest/gdelt",
  "/api/v1/agents/scraper",
]);

export function proxy(req: NextRequest) {
  if (PUBLIC_PATHS.has(req.nextUrl.pathname)) {
    return NextResponse.next();
  }

  if (
    BEARER_PATHS.has(req.nextUrl.pathname) &&
    req.headers.get("authorization")?.startsWith("Bearer ")
  ) {
    return NextResponse.next();
  }

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
  // Gate pages and API routes. Exact public health/liveness and metadata paths are
  // allowlisted inside proxy; Next internals remain excluded.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
