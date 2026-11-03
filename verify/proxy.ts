import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { BETA_COOKIE, BETA_TTL_SECONDS, guestValid, loadGuests, passUser } from "@/lib/beta-gate";
import { ADMIN_COOKIE, sessionSecret, verifySession } from "@/lib/admin-auth";
import { ALWAYS_OPEN, CAPTURE_COOKIE, VIEWER_COOKIE, captureAllowed, classifyUserAgent, isProbePath } from "@/lib/bot-guard";

/**
 * Guest access gate (HTTP Basic Auth) for the MPP.
 *
 * Presents a browser username/password prompt so the platform is only reachable
 * with the shared guest credentials.
 *
 * ⚠️ REQUIRES ENVIRONMENT VARIABLES. This gate previously carried four
 * username/password pairs as literals in this file. They are gone, and setting
 * `GUEST_LOGINS` (or `GUEST_USER`/`GUEST_PASS`) in Vercel is now mandatory —
 * with neither set, every request is refused. See "fails closed" below.
 *
 * ── Why the literals had to go ────────────────────────────────────────
 * Vercel's deployment protection on this project is
 * `ssoProtection: all_except_custom_domains`, which exempts madgambit.io by
 * configuration. So SSO gates the preview URLs and this file is the ENTIRE
 * access control for production. Four passwords committed to a repository is
 * not access control: they appear in at least 7 commits, git history keeps
 * them after any later edit, they were sequential and guessable from any one
 * of them, and the repository was public for part of 2026-08-16.
 *
 * Treat every pair that was ever committed here as burned. Rotating to new
 * values in env is the point of this change; re-using an old one in env
 * would move it out of the diff while leaving it just as compromised.
 *
 * ── Fails closed, deliberately ────────────────────────────────────────
 * With no credentials configured this refuses everything rather than falling
 * back to a default. A gate that silently opens when its configuration is
 * missing is worse than no gate, because it reports as protection. The
 * trade-off is real and is the intended one: if the env vars are not set in
 * Vercel before this ships, production returns 401 for everyone, which is
 * loud, immediate and fixable in one settings change — as opposed to quietly
 * serving the whole platform to anyone who reads a two-year-old commit.
 *
 * NOTE: this is an application-level gate. It only takes effect once Vercel
 * Deployment Protection is turned OFF for this project — otherwise Vercel's own
 * SSO gate blocks the request before proxy runs.
 */
/**
 * `GUEST_LOGINS` — comma-separated `user:pass` pairs, so the multi-guest model
 * survives the move to env. `GUEST_USER`/`GUEST_PASS` still adds a single pair
 * and is kept because it already existed and may already be set.
 *
 *   GUEST_LOGINS="alpha:s3cret,beta:0ther"
 *
 * Parsed with indexOf rather than split(":") so a password containing a colon
 * is preserved rather than silently truncated at the first one.
 */
// loadGuests() lives in lib/beta-gate.ts so the /beta sign-in route checks
// exactly the same credentials this gate does.
const GUESTS = loadGuests();
const GUESTS_CONFIGURED = Object.keys(GUESTS).length > 0;

const PUBLIC_PATHS = new Set([
  "/api/health",
  "/api/v1/health/db",
  "/health",
  "/favicon.ico",
  "/favicon.png",
  "/icon.png",
  "/apple-icon.png",
  "/robots.txt",
  // Beta and first-line support for people without a pass yet: the signup-shield challenge, invite redemption,
  // open-beta admission, tickets, ticket status and the known-issues list. Each guards itself.
  "/api/v1/beta/challenge",
  "/api/v1/beta/redeem",
  "/api/v1/beta/join",
  "/api/v1/support/tickets",
  "/api/v1/support/known-issues",
  // The admin suite authenticates itself (lib/admin-guard.ts); its sign-in page must be reachable without a beta pass.
  "/admin",
  "/sitemap.xml",
  // CSP violation reports are sent by the browser out-of-band, not by page
  // code — the Reporting API may deliver a batch minutes later, from no page
  // context at all — so whether the guest Basic credentials ride along is
  // browser- and timing-dependent. Gating this path would drop reports
  // unpredictably and leave the Report-Only policy unmeasurable, which is the
  // exact defect it was added to fix. The route caps its own exposure: POST is
  // rate-limited and write-only, and its GET summary requires CRON_SECRET
  // regardless of what happens here.
  "/api/v1/csp-report",
  // The private-beta gate itself: the page and its two forms must be reachable
  // by someone who has no pass yet.
  "/beta",
  "/api/v1/beta/signin",
  "/api/v1/beta/signup",
  // The MADHAT'r Concierge on /beta answers visitors who have no pass yet. The
  // route is guest-facing by design (its own PUBLIC-ROUTE note) and rate-limited
  // at 20/min per IP.
  "/api/concierge/chat",
]);

/** Public brand assets the /beta page renders (logo, mascot, self-hosted fonts). */
const PUBLIC_PREFIXES = ["/brand/", "/fonts/", "/_vercel/", "/admin/", "/api/admin/"];

// Cron routes verify their own `Authorization: Bearer` secret (lib/bearer-secret.ts),
// and Vercel Cron sends exactly that header — not Basic auth. Without this
// pass-through the guest gate would 401 every scheduled invocation before the
// route's own check runs. Only these paths skip the gate, and only when a Bearer
// header is present; the route still rejects wrong/missing secrets itself.
const BEARER_PATHS = new Set([
  "/api/v1/cron/rollup",
  "/api/v1/cron/tickers",
  "/api/v1/cron/insights",
  "/api/v1/cron/weekly-report",
  "/api/v1/cron/memory",
  "/api/v1/cron/memory-weekly",
  "/api/v1/cron/daily-log",
  "/api/v1/perps/roll",
  "/api/v1/registrar/lapse",
  "/api/v1/ingest/gdelt",
  "/api/v1/agents/scraper",
  "/api/v1/agents/trader",
  // Newly bearer-guarded operator routes. Without these entries the guest gate
  // would 401 an operator call carrying a correct CRON_SECRET before the
  // route's own check ever ran — the guard would be in place and unreachable.
  //
  // /api/v1/gdelt/ingest is the PUSH counterpart to /api/v1/ingest/gdelt above:
  // same gdelt_signals table, same seven downstream readers (market proposals,
  // scandal graph, the platform chaos index), opposite direction. Only the pull
  // side was ever closed.
  "/api/v1/gdelt/ingest",
  "/api/v1/gdelt/whitelist",
  "/api/v1/registrar/reply",
]);

/** Who is asking: a guest username, "bearer" for a cron/operator call, or null. */
async function identify(req: NextRequest, path: string): Promise<string | null> {
  const header = req.headers.get("authorization");
  if (BEARER_PATHS.has(path) && header?.startsWith("Bearer ")) return "bearer";

  if (header?.startsWith("Basic ")) {
    // atob is available in the Edge runtime; a malformed header is just "no".
    let decoded = "";
    try {
      decoded = atob(header.slice(6));
    } catch {
      decoded = "";
    }
    const sep = decoded.indexOf(":");
    if (sep > 0) {
      const user = decoded.slice(0, sep);
      const pass = decoded.slice(sep + 1);
      // Constant-time, and Object.hasOwn-safe against prototype keys.
      if (guestValid(GUESTS, user, pass)) return user;
    }
  }

  // Creator Sign-in pass from /beta: an HMAC-signed cookie, re-verified here.
  return passUser(req.cookies.get(BETA_COOKIE)?.value, GUESTS);
}

/**
 * Pass the request on. For a signed-in guest loading a page, also (re)issue the
 * two script-readable cookies the screenshot watermark reads: the guest's name,
 * and whether they are exempt from capture deterrents (CAPTURE_ALLOWED_USERS).
 */
function pass(req: NextRequest, user: string | null): NextResponse {
  const res = NextResponse.next();
  if (!user || user === "bearer" || req.method !== "GET" || req.nextUrl.pathname.startsWith("/api/")) return res;
  const opts = { httpOnly: false, secure: true, sameSite: "lax" as const, path: "/", maxAge: BETA_TTL_SECONDS };
  if (req.cookies.get(VIEWER_COOKIE)?.value !== user) res.cookies.set(VIEWER_COOKIE, user, opts);
  const cap = captureAllowed(user);
  if (cap && req.cookies.get(CAPTURE_COOKIE)?.value !== "1") res.cookies.set(CAPTURE_COOKIE, "1", opts);
  if (!cap && req.cookies.has(CAPTURE_COOKIE)) res.cookies.delete(CAPTURE_COOKIE);
  return res;
}

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Liveness checks and robots.txt answer everyone, bots included.
  if (ALWAYS_OPEN.has(path)) return NextResponse.next();

  // Scanner probes (.env, .git, wp-login.php …) get a flat, bodiless 404 —
  // before the gate, so the gate is not a "something lives here" signal.
  if (isProbePath(path)) {
    return new NextResponse(null, { status: 404, headers: { "cache-control": "no-store" } });
  }

  const user = await identify(req, path);

  // Crawlers, scanners and HTTP libraries without a pass are turned away, on
  // the public paths too (the /beta page, brand assets, the concierge). A
  // signed-in guest is never blocked by User-Agent, so scripts with Basic
  // credentials keep working.
  if (!user && classifyUserAgent(req.headers.get("user-agent")) === "blocked") {
    return new NextResponse("Automated access is not permitted.", {
      status: 403,
      headers: { "cache-control": "no-store", "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (PUBLIC_PATHS.has(path) || PUBLIC_PREFIXES.some((p) => path.startsWith(p))) {
    return pass(req, user);
  }

  // General availability: the beta is over and the gate opens (operator setting, BETA_PHASE=ga).
  if (process.env.BETA_PHASE?.trim().toLowerCase() === "ga") return pass(req, user);

  // A signed-in admin (HMAC session cookie) may use the whole app, so /dashboard and the APIs behind it load for them
  // without a separate beta pass. The cookie is verified here; the admin routes and /dashboard re-check it themselves.
  if (verifySession(req.cookies.get(ADMIN_COOKIE)?.value, sessionSecret())) return NextResponse.next();

  // No credentials configured → refuse everything, and say why. Falling back
  // to a built-in pair is what this change exists to remove; a distinct body
  // makes a misconfiguration diagnosable at a glance instead of looking like
  // a wrong password.
  if (!GUESTS_CONFIGURED) {
    return new NextResponse(
      "Guest access is not configured. Set GUEST_LOGINS (or GUEST_USER/GUEST_PASS) in the deployment environment.",
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  if (user) return pass(req, user);

  // No pass. A page goes to the private-beta gate (request access, or Creator
  // Sign-in) instead of the browser's Basic-auth popup.
  if (!path.startsWith("/api/") && (req.method === "GET" || req.method === "HEAD")) {
    const to = req.nextUrl.clone();
    to.pathname = "/beta";
    to.search = "";
    if (path !== "/" && path !== "/beta") to.searchParams.set("next", path + req.nextUrl.search);
    return NextResponse.redirect(to, 307);
  }

  // An API call. Scripts and curl still get the Basic challenge; a fetch from
  // a page (sec-fetch-dest: empty) gets a plain 401, so no browser popup fires.
  // Realm must be Latin-1 only — a non-ASCII char (e.g. an em-dash) makes the
  // Edge runtime drop the whole header. Keep it plain ASCII.
  const fromPage = req.headers.get("sec-fetch-dest") === "empty";
  return new NextResponse(JSON.stringify({ success: false, error: "Private beta: sign in at /beta." }), {
    status: 401,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...(fromPage ? {} : { "WWW-Authenticate": 'Basic realm="MAD Gambit Guest Access", charset="UTF-8"' }),
    },
  });
}

export const config = {
  // Gate pages and API routes. Exact public health/liveness and metadata paths are
  // allowlisted inside proxy; Next internals remain excluded.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
