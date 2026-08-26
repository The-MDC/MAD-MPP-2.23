/**
 * MAD Gambit — CSP violation collector.
 * ══════════════════════════════════════════════════════════════════════
 * `next.config.ts` ships script-src/style-src/img-src/connect-src as
 * Content-Security-Policy-Report-Only, with a stated plan: "once the reports
 * are quiet, move the directives into the enforced list."
 *
 * That plan was unexecutable. The Report-Only header named no destination —
 * no `report-uri`, no `report-to`, no `Reporting-Endpoints` — so every
 * browser dutifully evaluated the policy, found the violations, and threw the
 * reports away. "Are the reports quiet?" had no answer, which is why the XSS
 * directives sat un-promoted indefinitely: the gate to promotion could never
 * open, because nothing was measuring it.
 *
 * This route is that destination. It accepts both wire formats, filters the
 * one class of report that would otherwise guarantee the answer is never
 * "quiet", and exposes the promotion gate as a single boolean.
 *
 * ── Why extension filtering is the load-bearing part ──────────────────
 * Browser extensions inject scripts and styles into every page they touch,
 * and each injection trips script-src/style-src. A user with a wallet
 * extension — i.e. the entire target audience of this app — generates a
 * steady stream of violations that no change to this codebase can ever
 * silence. Collecting reports without separating those out would replace
 * "no data" with "permanent noise": the same un-promotable state, now with
 * a dashboard. So reports whose blocked URL, source file or document URL
 * carries an extension scheme are counted and discarded, and only violations
 * the app can actually act on reach the log or the summary.
 *
 * ── Storage: logs, deliberately, not Postgres ─────────────────────────
 * Reports land in `console.warn` with a stable `[csp-report]` prefix, which
 * makes them greppable in Vercel runtime logs — the channel this project
 * already uses to read production behaviour. They are NOT written to Neon,
 * and that is a decision rather than an omission: this endpoint is
 * necessarily unauthenticated (see below), and an unauthenticated endpoint
 * that writes a row per request is an abuse amplifier pointed at the
 * database. If durable history is wanted later, the upgrade is a table plus
 * a batched insert here — but it should arrive with an authenticated
 * ingestion path, not on top of this one.
 *
 * ── Why this route is public ──────────────────────────────────────────
 * Violation reports are sent by the browser out-of-band, not by page code.
 * Whether the guest Basic-auth credentials from `proxy.ts` ride along with
 * them is browser- and timing-dependent (the Reporting API in particular may
 * deliver a batch minutes later, from no page context at all), so gating
 * this path would silently drop reports and recreate the original defect in
 * a subtler form. It is therefore listed in `proxy.ts`'s PUBLIC_PATHS, and
 * the exposure is bounded instead: rate-limited per IP, body-size capped,
 * write-only, with a hard ceiling on distinct keys held in memory. The read
 * side (GET) is the part worth protecting, and it requires CRON_SECRET.
 * ══════════════════════════════════════════════════════════════════════ */
import { NextResponse } from "next/server";
import { withRouteGuard } from "@/lib/with-route-guard";
import { requireBearerSecret } from "@/lib/bearer-secret";

export const dynamic = "force-dynamic";

/** A report is a few hundred bytes; anything larger is not a browser. */
const MAX_BODY_BYTES = 16_384;
/** Hard ceiling on distinct violations held per instance (memory bound). */
const MAX_KEYS = 200;
/** Aggregation window — entries older than this stop counting toward "quiet". */
const WINDOW_MS = 6 * 60 * 60 * 1000;
/** Log the 1st occurrence of a violation, then every 50th, not all of them. */
const LOG_EVERY = 50;
/** Truncation for URLs kept in memory and written to logs. */
const MAX_URI = 200;

/**
 * Extension schemes across the browsers that implement CSP reporting.
 * Ordered longest-first: alternation is greedy in source order, so `safari`
 * placed before `safari-web` would fail to match `safari-web-extension:`.
 * `webkit-masked-url:` is Safari's placeholder when it hides the real source
 * file of an injected script — same class of noise, different disguise.
 */
const EXTENSION_URI = /^(?:safari-web|ms-browser|chrome|moz|safari|edge)-extension:|^webkit-masked-url:/i;

interface Violation {
  directive: string;
  blockedUri: string;
  documentUri: string;
  sourceFile: string;
  line: number | null;
  sample: string;
  disposition: string;
}

interface Aggregate extends Violation {
  key: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
}

/**
 * Per-instance, per-process. Serverless gives each warm instance its own copy,
 * so a GET may well hit an instance that saw none of the POSTs — the same
 * caveat `lib/rate-limit.ts` carries, and for the same reason. The logs are
 * the complete record; this map is the fast answer from whichever instance
 * answers, and the summary says so in its own payload.
 */
const actionable = new Map<string, Aggregate>();
let extensionReports = 0;
const bootedAt = Date.now();

const str = (v: unknown): string => (typeof v === "string" ? v : "");
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** Strip query and fragment, then cap — a report URL is not a payload channel. */
function trimUri(uri: string): string {
  if (!uri) return "";
  const bare = uri.split(/[?#]/, 1)[0];
  return bare.length > MAX_URI ? `${bare.slice(0, MAX_URI)}…` : bare;
}

type Raw = Record<string, unknown>;

/**
 * One reader for both wire formats. CSP Level 2 (`application/csp-report`)
 * uses kebab-case keys under a `csp-report` wrapper; the Reporting API
 * (`application/reports+json`) posts an array of `{ type, body }` with
 * camelCase keys. The field *meanings* are identical, so rather than two
 * parsers this reads whichever spelling is present.
 */
function toViolation(r: Raw): Violation {
  return {
    directive: str(r["effective-directive"]) || str(r.effectiveDirective) || str(r["violated-directive"]) || str(r.violatedDirective),
    blockedUri: trimUri(str(r["blocked-uri"]) || str(r.blockedURL)),
    documentUri: trimUri(str(r["document-uri"]) || str(r.documentURL)),
    sourceFile: trimUri(str(r["source-file"]) || str(r.sourceFile)),
    line: num(r["line-number"]) ?? num(r.lineNumber),
    sample: (str(r["script-sample"]) || str(r.sample)).slice(0, 120),
    disposition: str(r.disposition) || "report",
  };
}

function extract(payload: unknown): Violation[] {
  // Reporting API — an array that may also carry deprecation/intervention
  // reports if an endpoint name is ever shared; only CSP entries are ours.
  if (Array.isArray(payload)) {
    return payload
      .filter((r): r is Raw => !!r && typeof r === "object")
      .filter((r) => {
        const t = str(r.type);
        return t === "" || t === "csp-violation";
      })
      .map((r) => (r.body && typeof r.body === "object" ? (r.body as Raw) : r))
      .map(toViolation);
  }
  if (payload && typeof payload === "object") {
    const p = payload as Raw;
    const wrapped = p["csp-report"];
    if (wrapped && typeof wrapped === "object") return [toViolation(wrapped as Raw)];
    return [toViolation(p)];
  }
  return [];
}

/** Extension-injected, therefore not fixable here. See the header comment. */
function isExtensionNoise(v: Violation): boolean {
  return (
    EXTENSION_URI.test(v.blockedUri) ||
    EXTENSION_URI.test(v.sourceFile) ||
    EXTENSION_URI.test(v.documentUri)
  );
}

/** Same directive + same blocked resource + same source = the same problem. */
const keyOf = (v: Violation): string => `${v.directive}|${v.blockedUri}|${v.sourceFile}`;

/**
 * Map.forEach, not `for...of` over the map.
 *
 * tsconfig.json targets **es5** with no `downlevelIteration`, so `for...of` and
 * spread over a Map, a Set or any iterator are compile errors — arrays and
 * strings are the only things TypeScript special-cases at that target. forEach
 * is the portable form and needs no config change to accommodate one route.
 */
function prune(now: number): void {
  const stale: string[] = [];
  actionable.forEach((a, k) => {
    if (now - a.lastSeen > WINDOW_MS) stale.push(k);
  });
  stale.forEach((k) => actionable.delete(k));
}

/** At the ceiling, drop the least recently seen so a flood can't grow memory. */
function evictOldest(): void {
  // Collected into an array rather than tracking a running minimum in a
  // closure variable: TypeScript's control-flow analysis does not follow
  // assignments made inside a callback, so a `let oldestKey: string | null`
  // written by forEach still narrows to `null` afterwards and the guard below
  // it becomes unreachable. n is capped at MAX_KEYS, so the sort is cheap.
  const rows: { key: string; lastSeen: number }[] = [];
  actionable.forEach((a, k) => rows.push({ key: k, lastSeen: a.lastSeen }));
  if (rows.length === 0) return;
  rows.sort((x, y) => x.lastSeen - y.lastSeen);
  actionable.delete(rows[0].key);
}

function record(v: Violation, now: number): void {
  const key = keyOf(v);
  const existing = actionable.get(key);
  if (existing) {
    existing.count += 1;
    existing.lastSeen = now;
    if (existing.count % LOG_EVERY === 0) log(existing);
    return;
  }
  if (actionable.size >= MAX_KEYS) evictOldest();
  const fresh: Aggregate = { ...v, key, count: 1, firstSeen: now, lastSeen: now };
  actionable.set(key, fresh);
  log(fresh);
}

/**
 * One line, stable prefix, JSON payload — `[csp-report]` is the grep handle in
 * Vercel runtime logs. warn rather than error: a Report-Only violation is a
 * finding to triage, not a failure, and error level would page on browser noise.
 */
function log(a: Aggregate): void {
  console.warn(
    `[csp-report] ${JSON.stringify({
      directive: a.directive,
      blocked: a.blockedUri,
      doc: a.documentUri,
      src: a.sourceFile,
      line: a.line,
      sample: a.sample || undefined,
      disposition: a.disposition,
      n: a.count,
    })}`,
  );
}

/**
 * POST /api/v1/csp-report — ingest. Always cheap, always terminal: browsers
 * ignore the response body, so this returns 204 and never asks for a retry.
 */
export const POST = withRouteGuard(
  { mode: "public", bucket: "csp-report", limit: 60, windowMs: 60_000 },
  async (req: Request) => {
    const declared = Number(req.headers.get("content-length") ?? 0);
    if (declared > MAX_BODY_BYTES) return new Response(null, { status: 413 });

    const raw = await req.text();
    // content-length is a claim; the body is the fact. Check both.
    if (raw.length > MAX_BODY_BYTES) return new Response(null, { status: 413 });

    let payload: unknown;
    try {
      payload = JSON.parse(raw);
    } catch {
      return NextResponse.json({ success: false, error: "invalid report body" }, { status: 400 });
    }

    const now = Date.now();
    prune(now);

    for (const v of extract(payload)) {
      if (!v.directive) continue; // not a CSP report in any recognizable shape
      if (isExtensionNoise(v)) {
        extensionReports += 1;
        continue;
      }
      record(v, now);
    }

    return new Response(null, { status: 204 });
  },
);

/**
 * GET /api/v1/csp-report — the promotion gate, as a single boolean.
 *
 * `quiet: true` means this instance has seen no app-attributable violation in
 * the last 6 hours, which is the condition next.config.ts names for moving
 * script-src/style-src/img-src/connect-src out of Report-Only and into the
 * enforced policy. Anything in `top` is a directive that would have broken a
 * real page had it been enforced, and needs fixing or allow-listing first.
 *
 * Operator-only: the summary enumerates the app's script/style/connect origins
 * and the paths that load them, which is reconnaissance if handed out freely.
 */
export async function GET(req: Request): Promise<Response> {
  const denied = requireBearerSecret(req, "CRON_SECRET");
  if (denied) return denied;

  const now = Date.now();
  prune(now);

  // Not `[...actionable.values()]` — spreading an iterator is the same es5
  // downlevelIteration error as `for...of` over the map. See prune() above.
  const rows: Aggregate[] = [];
  actionable.forEach((a) => rows.push(a));
  rows.sort((a, b) => b.count - a.count);

  const byDirective: Record<string, number> = {};
  // `rows` is an array, so this for...of is fine at es5 — arrays and strings
  // are the two things TypeScript special-cases.
  for (const r of rows) byDirective[r.directive] = (byDirective[r.directive] ?? 0) + r.count;

  return NextResponse.json({
    success: true,
    quiet: rows.length === 0,
    note:
      "In-memory and per-instance: this is one serverless instance's view since its last cold start. " +
      "The complete record is the [csp-report] lines in the runtime logs.",
    window: { hours: WINDOW_MS / 3_600_000, instanceUptimeSec: Math.round((now - bootedAt) / 1000) },
    actionable: {
      distinct: rows.length,
      total: rows.reduce((n, r) => n + r.count, 0),
      atKeyCeiling: rows.length >= MAX_KEYS,
      byDirective,
      top: rows.slice(0, 25).map((r) => ({
        directive: r.directive,
        blocked: r.blockedUri,
        doc: r.documentUri,
        src: r.sourceFile,
        line: r.line,
        sample: r.sample || undefined,
        count: r.count,
        firstSeen: new Date(r.firstSeen).toISOString(),
        lastSeen: new Date(r.lastSeen).toISOString(),
      })),
    },
    filteredExtensionReports: extensionReports,
  });
}
