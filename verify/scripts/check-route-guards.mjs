#!/usr/bin/env node
/**
 * Fails (report-only for now — see ci.yml) if a mutating API route handler
 * (POST/PUT/PATCH/DELETE) has no recognizable AUTHORIZATION guard.
 *
 * Why this exists: an audit found 33 of 53 mutating routes under app/api had
 * no protection at all, not by decision — each route.ts is independently
 * responsible for remembering to call a guard, and most didn't. This makes
 * that failure mode visible in CI instead of only in a manual audit.
 *
 * ── A RATE LIMIT IS NOT AUTHORIZATION ────────────────────────────────────
 * This script used to list `enforceRateLimit(` alongside the auth guards, and
 * that single line cost it the thing it was built to catch. It printed
 *
 *     ✅ all mutating routes are guarded (95 route files scanned)
 *
 * while 26 mutating routes had no identity check of any kind — among them
 * `cards/collect`, which read `walletAddress` AND `rarity` from the request
 * body and wrote the row, so any anonymous caller could mint a Legendary into
 * any wallet at 30 requests a minute. The paid path next door authenticated
 * properly. The check reported both as protected.
 *
 * A rate limit governs HOW FAST an anonymous caller can act. It never
 * establishes WHO they are. The two are different guarantees and are now
 * counted separately:
 *
 *   AUTH_CALLS — establishes identity or a shared secret. Satisfies the check.
 *   COST_CALLS — caps spend/abuse. Does NOT satisfy it on its own.
 *
 * A route with only a cost guard must carry `// PUBLIC-ROUTE: <reason>`, the
 * same as a route with no guard at all — because that is what it is. The
 * marker makes each deliberate exemption visible in review rather than
 * silently absorbed into a green tick.
 *
 * ── Reading the output ───────────────────────────────────────────────────
 * The summary prints the scanned file count and the exempt count. A count of
 * zero scanned files means the walk found nothing and the tick is meaningless
 * — this repo has been bitten three separate times by a green gate that was
 * looking at an empty set, so the number is printed every run, and a zero
 * scan is a hard failure rather than a pass.
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "app", "api");

const MUTATING_METHODS = ["POST", "PUT", "PATCH", "DELETE"];

/** Establishes identity, ownership, or a shared secret. Satisfies the check. */
const AUTH_CALLS = [
  "requireMadxRouteAuth(",
  "requireBearerSecret(",
  // Admin suite: verifies the signed admin session cookie and the role permission (lib/admin-guard.ts).
  "requireAdmin(",
  "getSessionFromRequest(",
  'mode: "session"',
  'mode: "bearer"',
  // A role credential carried in a named header — `x-pause-guardian`,
  // `x-registrar`. Timing-safe, and fails CLOSED when its env var is unset
  // rather than degrading to session auth. This is the general form of the
  // guardianAuthorised special case below, and a real auth guard.
  "requireHeaderSecret(",
  // registrar/pause carries its own guardian check against PAUSE_GUARDIAN_TOKEN
  // rather than going through requireBearerSecret, because the pause credential
  // is a separate custody model from CRON_SECRET. It is a real auth guard and
  // was being reported as unguarded purely because it is spelled differently.
  "guardianAuthorised(",
];

/**
 * Caps cost or abuse. Necessary on public routes, never sufficient on its own.
 * `mode: "public"` is withRouteGuard's own name for exactly this — deliberately
 * open, still rate-limited — so it belongs here and not with the auth calls.
 */
const COST_CALLS = ["enforceRateLimit(", 'mode: "public"'];

/**
 * Matches both comment styles. Several routes wrote the exemption inside a
 * JSDoc block as ` * PUBLIC-ROUTE: …` — a perfectly clear, reviewable marker
 * that the old exact-string test for `// PUBLIC-ROUTE:` silently missed, so
 * auth/logout was reported as a failure while carrying a written-out reason.
 */
const OPT_OUT = /(?:\/\/|\*)\s*PUBLIC-ROUTE:/;

/**
 * KNOWN COST-ONLY ROUTES — a ratchet, not an amnesty.
 *
 * Each of these mutates state or spends money with a rate limit and no identity
 * check. Every one of them needs a decision that is a PRODUCT decision, not an
 * engineering one — who is allowed to create a market, whether the concierge is
 * free to anonymous visitors, whether GDELT ingestion is an operator action —
 * and guessing at those in a security pass would be inventing policy.
 *
 * So they are enumerated here and reported every run, and the check does not
 * fail on them. It DOES fail on anything not in this list, which is the point:
 * the debt is fixed in size, visible by name, and cannot grow. Deleting a line
 * from this list is how a route graduates; adding one should require an
 * argument in review.
 *
 * When the decision lands, the fix is `withRouteGuard({ mode: "session" | "bearer" })`
 * or a `// PUBLIC-ROUTE:` marker — and the line comes out of here.
 */
const KNOWN_COST_ONLY = new Set([
  // Empty, and the aim is to keep it that way. Every entry that was here has
  // been resolved: four session-guarded, three bearer-guarded, one marked
  // PUBLIC-ROUTE because the openness was already a written-down decision, and
  // one route deleted outright. A new line here should require an argument.
]);

/** Normalise to a repo-relative POSIX path so the allowlist is CWD-independent. */
function relKey(file) {
  const i = file.lastIndexOf(`${path.sep}app${path.sep}api${path.sep}`);
  return i === -1 ? file : file.slice(i + 1).split(path.sep).join("/");
}

async function findRouteFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findRouteFiles(full)));
    } else if (entry.name === "route.ts") {
      files.push(full);
    }
  }
  return files;
}

function exportsMutatingMethod(source) {
  return MUTATING_METHODS.filter((method) => {
    const patterns = [
      new RegExp(`export\\s+async\\s+function\\s+${method}\\b`),
      new RegExp(`export\\s+function\\s+${method}\\b`),
      new RegExp(`export\\s+const\\s+${method}\\s*=`),
      new RegExp(`export\\s*\\{[^}]*\\bas\\s+${method}\\b`),
    ];
    return patterns.some((re) => re.test(source));
  });
}

async function main() {
  const files = await findRouteFiles(API_DIR);

  // A gate that scanned nothing is not a passing gate.
  if (files.length === 0) {
    console.error(`❌ route-guard check: found 0 route.ts files under ${API_DIR}.`);
    console.error("   The walk matched nothing, so a pass here would mean nothing. Check the path.");
    process.exitCode = 1;
    return;
  }

  const unguarded = [];
  const costOnly = [];   // new, and therefore failing
  const knownDebt = [];  // enumerated in KNOWN_COST_ONLY — reported, not failing
  const staleAllow = []; // in the allowlist but no longer cost-only: remove the line
  let exempt = 0;
  let mutating = 0;

  for (const file of files) {
    const source = await readFile(file, "utf8");
    const methods = exportsMutatingMethod(source);
    if (methods.length === 0) continue;
    mutating += 1;

    const hasAuth = AUTH_CALLS.some((call) => source.includes(call));
    if (hasAuth) continue;

    const hasCost = COST_CALLS.some((call) => source.includes(call));
    const hasOptOut = OPT_OUT.test(source);
    if (hasOptOut) {
      exempt += 1;
      // Deliberately public AND uncapped is still worth surfacing — an open
      // route with no cost ceiling is a free amplifier even when the openness
      // is intended.
      if (!hasCost) {
        console.warn(
          `   note: ${path.relative(process.cwd(), file)} is marked PUBLIC-ROUTE but has no rate limit.`,
        );
      }
      continue;
    }

    const rel = path.relative(process.cwd(), file);
    const key = relKey(file);
    if (hasCost) {
      if (KNOWN_COST_ONLY.has(key)) knownDebt.push({ file: rel, methods });
      else costOnly.push({ file: rel, methods });
    } else unguarded.push({ file: rel, methods });
  }

  // An allowlist entry that no longer describes reality is the same class of
  // problem as the bug this whole file exists to prevent: a stale exemption
  // quietly covering something it no longer matches.
  const stillCostOnly = new Set([...knownDebt].map((d) => relKey(path.resolve(d.file))));
  for (const key of KNOWN_COST_ONLY) {
    if (!stillCostOnly.has(key)) staleAllow.push(key);
  }

  const failures = unguarded.length + costOnly.length;

  if (knownDebt.length > 0) {
    console.log(`ℹ️  ${knownDebt.length} known cost-only route(s), pending a product decision:`);
    for (const { file } of knownDebt) console.log(`   ${file}`);
    console.log("   (enumerated in KNOWN_COST_ONLY — tracked, not failing. New ones DO fail.)\n");
  }

  if (staleAllow.length > 0) {
    console.warn("⚠️  KNOWN_COST_ONLY has entries that are no longer cost-only. Remove them:");
    for (const key of staleAllow) console.warn(`   ${key}`);
    console.warn("");
    process.exitCode = 1;
  }

  if (failures === 0) {
    // Don't print a tick over a stale-allowlist failure — a green summary
    // sitting under a warning is exactly how a real problem gets scrolled past.
    if (staleAllow.length === 0) {
      console.log(
        `✅ route-guard check: ${mutating} mutating route(s) across ${files.length} route file(s) — ` +
          `all authenticated, marked public, or known debt (${exempt} exempt, ${knownDebt.length} tracked).`,
      );
    }
    return;
  }

  if (costOnly.length > 0) {
    console.warn(
      `⚠️  route-guard check: ${costOnly.length} mutating route(s) have ONLY a rate limit and no ` +
        "authorization:\n",
    );
    for (const { file, methods } of costOnly) console.warn(`   ${file}  [${methods.join(", ")}]`);
    console.warn(
      "\n   A rate limit caps how fast an anonymous caller acts; it does not establish who they\n" +
        "   are. Add a session/bearer guard, or — if the route is genuinely meant to be open —\n" +
        "   a `// PUBLIC-ROUTE: <reason>` comment so the decision is visible in review.\n",
    );
  }

  if (unguarded.length > 0) {
    console.warn(
      `⚠️  route-guard check: ${unguarded.length} mutating route(s) have no guard at all and no ` +
        "PUBLIC-ROUTE marker:\n",
    );
    for (const { file, methods } of unguarded) console.warn(`   ${file}  [${methods.join(", ")}]`);
    console.warn(
      "\n   Each needs requireMadxRouteAuth / requireBearerSecret / withRouteGuard, or an\n" +
        "   explicit `// PUBLIC-ROUTE: <reason>`.\n",
    );
  }

  console.warn(
    `Scanned ${files.length} route file(s); ${mutating} export a mutating method; ${exempt} exempt.`,
  );
  process.exitCode = 1;
}

main().catch((err) => {
  console.error("route-guard check crashed:", err);
  process.exitCode = 1;
});
